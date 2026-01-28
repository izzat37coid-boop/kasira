-- =====================================================
-- KASIRA POS - Database Migrations
-- Supabase PostgreSQL Schema
-- Role-Based Access: OWNER & KASIR
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. PROFILES TABLE (User Data)
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'kasir')),
  business_name VARCHAR(255),
  package_type VARCHAR(50),
  status VARCHAR(50) DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'expired', 'pending_payment')),
  expired_at TIMESTAMPTZ,
  branch_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_branch_id ON profiles(branch_id);

-- =====================================================
-- 2. BRANCHES TABLE (Cabang)
-- =====================================================
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  location TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_branches_owner_id ON branches(owner_id);

-- Add foreign key untuk branch_id di profiles
ALTER TABLE profiles 
  DROP CONSTRAINT IF EXISTS fk_profiles_branch_id;
  
ALTER TABLE profiles 
  ADD CONSTRAINT fk_profiles_branch_id 
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;

-- =====================================================
-- 3. CATEGORIES TABLE (Kategori Produk)
-- =====================================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, branch_id)
);

CREATE INDEX IF NOT EXISTS idx_categories_branch_id ON categories(branch_id);

-- =====================================================
-- 4. PRODUCTS TABLE (Produk)
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  cost_price NUMERIC(12, 2) NOT NULL CHECK (cost_price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_branch_id ON products(branch_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);

-- =====================================================
-- 5. TRANSACTIONS TABLE (Transaksi Header)
-- =====================================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  cashier_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  tax NUMERIC(12, 2) NOT NULL DEFAULT 0,
  discount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'expired')),
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('CASH', 'TRANSFER', 'QRIS')),
  payment_details JSONB,
  date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_branch_id ON transactions(branch_id);
CREATE INDEX IF NOT EXISTS idx_transactions_cashier_id ON transactions(cashier_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);

-- =====================================================
-- 6. TRANSACTION_ITEMS TABLE (Detail Item Transaksi)
-- =====================================================
CREATE TABLE IF NOT EXISTS transaction_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_snapshot NUMERIC(12, 2) NOT NULL,
  cost_snapshot NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction_id ON transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_product_id ON transaction_items(product_id);

-- =====================================================
-- 7. STOCK_ADJUSTMENTS TABLE (Riwayat Penyesuaian Stok)
-- =====================================================
CREATE TABLE IF NOT EXISTS stock_adjustments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  adjusted_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  quantity_change INTEGER NOT NULL,
  stock_before INTEGER NOT NULL,
  stock_after INTEGER NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_adjustments_product_id ON stock_adjustments(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_created_at ON stock_adjustments(created_at DESC);

-- =====================================================
-- 8. SUBSCRIPTIONS TABLE (Langganan)
-- =====================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  package VARCHAR(50) NOT NULL CHECK (package IN ('Trial', 'Pro', 'Bisnis')),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- =====================================================
-- 9. PAYMENT_RECORDS TABLE (Riwayat Pembayaran)
-- =====================================================
CREATE TABLE IF NOT EXISTS payment_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  amount NUMERIC(12, 2) NOT NULL,
  payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('va', 'qris')),
  bank VARCHAR(50),
  va_number VARCHAR(100),
  qris_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  midtrans_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_records_order_id ON payment_records(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_user_id ON payment_records(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_status ON payment_records(status);

-- =====================================================
-- TRIGGERS - Auto Update Timestamps
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_branches_updated_at ON branches;
CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON branches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_records_updated_at ON payment_records;
CREATE TRIGGER update_payment_records_updated_at BEFORE UPDATE ON payment_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILES POLICIES
-- =====================================================

-- Users can read their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Helper Function to prevent Infinite Recursion
CREATE OR REPLACE FUNCTION check_is_owner()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'owner'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Owners can view all profiles in their branches
DROP POLICY IF EXISTS "Owners can view all profiles" ON profiles;
CREATE POLICY "Owners can view all profiles" ON profiles
  FOR SELECT USING (
    check_is_owner()
  );

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow insert for new registrations
DROP POLICY IF EXISTS "Allow profile creation" ON profiles;
CREATE POLICY "Allow profile creation" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Owners can insert staff profiles (FIX for Staff Creation)
DROP POLICY IF EXISTS "Owners can insert staff profiles" ON profiles;
CREATE POLICY "Owners can insert staff profiles" ON profiles
  FOR INSERT WITH CHECK (
    role = 'kasir' AND 
    EXISTS (SELECT 1 FROM branches WHERE id = branch_id AND owner_id = auth.uid())
  );

-- =====================================================
-- BRANCHES POLICIES
-- =====================================================

-- Owners can manage their own branches
DROP POLICY IF EXISTS "Owners can view own branches" ON branches;
CREATE POLICY "Owners can view own branches" ON branches
  FOR SELECT USING (
    owner_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND branch_id = branches.id
    )
  );

DROP POLICY IF EXISTS "Owners can insert branches" ON branches;
CREATE POLICY "Owners can insert branches" ON branches
  FOR INSERT WITH CHECK (
    owner_id = auth.uid()
  );

DROP POLICY IF EXISTS "Owners can update own branches" ON branches;
CREATE POLICY "Owners can update own branches" ON branches
  FOR UPDATE USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Owners can delete own branches" ON branches;
CREATE POLICY "Owners can delete own branches" ON branches
  FOR DELETE USING (owner_id = auth.uid());

-- =====================================================
-- CATEGORIES POLICIES
-- =====================================================

-- Users can view categories in their branch
DROP POLICY IF EXISTS "Users can view branch categories" ON categories;
CREATE POLICY "Users can view branch categories" ON categories
  FOR SELECT USING (
    branch_id IN (
      SELECT branch_id FROM profiles WHERE id = auth.uid()
      UNION
      SELECT id FROM branches WHERE owner_id = auth.uid()
    )
  );

-- Only owners can manage categories
DROP POLICY IF EXISTS "Owners can insert categories" ON categories;
CREATE POLICY "Owners can insert categories" ON categories
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM branches b
      WHERE b.id = branch_id AND b.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners can update categories" ON categories;
CREATE POLICY "Owners can update categories" ON categories
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM branches b
      WHERE b.id = branch_id AND b.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners can delete categories" ON categories;
CREATE POLICY "Owners can delete categories" ON categories
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM branches b
      WHERE b.id = branch_id AND b.owner_id = auth.uid()
    )
  );

-- =====================================================
-- PRODUCTS POLICIES
-- =====================================================

-- Users can view products in their branch
DROP POLICY IF EXISTS "Users can view branch products" ON products;
CREATE POLICY "Users can view branch products" ON products
  FOR SELECT USING (
    branch_id IN (
      SELECT branch_id FROM profiles WHERE id = auth.uid()
      UNION
      SELECT id FROM branches WHERE owner_id = auth.uid()
    )
  );

-- Only owners can manage products
DROP POLICY IF EXISTS "Owners can insert products" ON products;
CREATE POLICY "Owners can insert products" ON products
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM branches b
      WHERE b.id = branch_id AND b.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners can update products" ON products;
CREATE POLICY "Owners can update products" ON products
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM branches b
      WHERE b.id = branch_id AND b.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners can delete products" ON products;
CREATE POLICY "Owners can delete products" ON products
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM branches b
      WHERE b.id = branch_id AND b.owner_id = auth.uid()
    )
  );

-- =====================================================
-- TRANSACTIONS POLICIES
-- =====================================================

-- Users can view transactions in their branch
DROP POLICY IF EXISTS "Users can view branch transactions" ON transactions;
CREATE POLICY "Users can view branch transactions" ON transactions
  FOR SELECT USING (
    cashier_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM branches b
      INNER JOIN profiles p ON b.owner_id = p.id
      WHERE p.id = auth.uid() AND b.id = transactions.branch_id
    )
  );

-- Kasir can create transactions in their branch
DROP POLICY IF EXISTS "Kasir can create transactions" ON transactions;
CREATE POLICY "Kasir can create transactions" ON transactions
  FOR INSERT WITH CHECK (
    cashier_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND branch_id = transactions.branch_id
    )
  );

-- Allow update for payment status changes
DROP POLICY IF EXISTS "Allow transaction updates" ON transactions;
CREATE POLICY "Allow transaction updates" ON transactions
  FOR UPDATE USING (
    cashier_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM branches b
      INNER JOIN profiles p ON b.owner_id = p.id
      WHERE p.id = auth.uid() AND b.id = transactions.branch_id
    )
  );

-- =====================================================
-- TRANSACTION_ITEMS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view transaction items" ON transaction_items;
CREATE POLICY "Users can view transaction items" ON transaction_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM transactions t
      WHERE t.id = transaction_items.transaction_id
      AND (
        t.cashier_id = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM branches b
          INNER JOIN profiles p ON b.owner_id = p.id
          WHERE p.id = auth.uid() AND b.id = t.branch_id
        )
      )
    )
  );

DROP POLICY IF EXISTS "Kasir can insert transaction items" ON transaction_items;
CREATE POLICY "Kasir can insert transaction items" ON transaction_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM transactions t
      WHERE t.id = transaction_id AND t.cashier_id = auth.uid()
    )
  );

-- =====================================================
-- STOCK_ADJUSTMENTS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view stock adjustments" ON stock_adjustments;
CREATE POLICY "Users can view stock adjustments" ON stock_adjustments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM products p
      INNER JOIN branches b ON p.branch_id = b.id
      INNER JOIN profiles pr ON (b.owner_id = pr.id OR pr.branch_id = b.id)
      WHERE pr.id = auth.uid() AND p.id = stock_adjustments.product_id
    )
  );

DROP POLICY IF EXISTS "Owners can insert stock adjustments" ON stock_adjustments;
CREATE POLICY "Owners can insert stock adjustments" ON stock_adjustments
  FOR INSERT WITH CHECK (
    adjusted_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- =====================================================
-- SUBSCRIPTIONS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Allow subscription creation" ON subscriptions;
CREATE POLICY "Allow subscription creation" ON subscriptions
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Allow subscription updates" ON subscriptions;
CREATE POLICY "Allow subscription updates" ON subscriptions
  FOR UPDATE USING (user_id = auth.uid());

-- =====================================================
-- PAYMENT_RECORDS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view own payments" ON payment_records;
CREATE POLICY "Users can view own payments" ON payment_records
  FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

DROP POLICY IF EXISTS "Allow payment creation" ON payment_records;
CREATE POLICY "Allow payment creation" ON payment_records
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow payment updates" ON payment_records;
CREATE POLICY "Allow payment updates" ON payment_records
  FOR UPDATE USING (true);

-- =====================================================
-- DATABASE FUNCTIONS
-- =====================================================

-- Function: Create Transaction Atomically
CREATE OR REPLACE FUNCTION create_transaction_atomic(
  p_branch_id UUID,
  p_cashier_id UUID,
  p_items JSONB,
  p_payment_method TEXT,
  p_bank TEXT DEFAULT NULL,
  p_tax NUMERIC DEFAULT 0,
  p_discount NUMERIC DEFAULT 0
) RETURNS JSONB AS $$
DECLARE
  v_transaction_id UUID;
  v_item JSONB;
  v_product RECORD;
  v_subtotal NUMERIC := 0;
  v_total NUMERIC := 0;
  v_payment_details JSONB;
  v_va_number TEXT;
  v_qris_url TEXT;
BEGIN
  -- 1. Validate stock availability for all items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT * INTO v_product FROM products 
    WHERE id = (v_item->>'productId')::UUID
    FOR UPDATE; -- Lock row to prevent race condition
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product not found: %', v_item->>'productId';
    END IF;
    
    IF v_product.stock < (v_item->>'quantity')::INTEGER THEN
      RAISE EXCEPTION 'Insufficient stock for product: %. Available: %, Requested: %', 
        v_product.name, v_product.stock, v_item->>'quantity';
    END IF;
    
    v_subtotal := v_subtotal + (v_product.price * (v_item->>'quantity')::INTEGER);
  END LOOP;
  
  -- 2. Calculate total
  v_total := v_subtotal + p_tax - p_discount;
  
  -- 3. Generate payment details
  IF p_payment_method = 'TRANSFER' THEN
    v_va_number := p_bank || LPAD(FLOOR(RANDOM() * 10000000000)::TEXT, 10, '0');
    v_payment_details := jsonb_build_object(
      'bank', p_bank,
      'va_number', v_va_number
    );
  ELSIF p_payment_method = 'QRIS' THEN
    v_qris_url := 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=QRIS_' || gen_random_uuid()::TEXT;
    v_payment_details := jsonb_build_object(
      'qris_url', v_qris_url
    );
  ELSE
    v_payment_details := '{}'::JSONB;
  END IF;
  
  -- 4. Create transaction
  INSERT INTO transactions (
    branch_id, cashier_id, subtotal, tax, discount, total,
    status, payment_method, payment_details
  ) VALUES (
    p_branch_id, p_cashier_id, v_subtotal, p_tax, p_discount, v_total,
    CASE WHEN p_payment_method = 'CASH' THEN 'success' ELSE 'pending' END,
    p_payment_method, v_payment_details
  ) RETURNING id INTO v_transaction_id;
  
  -- 5. Insert transaction items and update stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT * INTO v_product FROM products 
    WHERE id = (v_item->>'productId')::UUID;
    
    -- Insert transaction item
    INSERT INTO transaction_items (
      transaction_id, product_id, name, quantity, price_snapshot, cost_snapshot
    ) VALUES (
      v_transaction_id, v_product.id, v_product.name,
      (v_item->>'quantity')::INTEGER, v_product.price, v_product.cost_price
    );
    
    -- Update stock (only if payment is CASH or will be updated on callback)
    IF p_payment_method = 'CASH' THEN
      UPDATE products 
      SET stock = stock - (v_item->>'quantity')::INTEGER
      WHERE id = v_product.id;
    END IF;
  END LOOP;
  
  -- 6. Return transaction data
  RETURN jsonb_build_object(
    'id', v_transaction_id,
    'branchId', p_branch_id,
    'cashierId', p_cashier_id,
    'subtotal', v_subtotal,
    'tax', p_tax,
    'discount', p_discount,
    'total', v_total,
    'status', CASE WHEN p_payment_method = 'CASH' THEN 'success' ELSE 'pending' END,
    'paymentMethod', p_payment_method,
    'paymentDetails', v_payment_details,
    'date', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update Payment Status (Midtrans Callback)
CREATE OR REPLACE FUNCTION update_payment_status(
  p_transaction_id UUID,
  p_status TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_transaction RECORD;
  v_item RECORD;
BEGIN
  -- Get transaction
  SELECT * INTO v_transaction FROM transactions WHERE id = p_transaction_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction not found: %', p_transaction_id;
  END IF;
  
  -- Update transaction status
  UPDATE transactions SET status = p_status WHERE id = p_transaction_id;
  
  -- If success, update stock
  IF p_status = 'success' AND v_transaction.status = 'pending' THEN
    FOR v_item IN 
      SELECT * FROM transaction_items WHERE transaction_id = p_transaction_id
    LOOP
      UPDATE products 
      SET stock = stock - v_item.quantity
      WHERE id = v_item.product_id;
    END LOOP;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Adjust Stock with Logging
CREATE OR REPLACE FUNCTION adjust_stock_with_log(
  p_product_id UUID,
  p_adjusted_by UUID,
  p_quantity_change INTEGER,
  p_note TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_product RECORD;
  v_new_stock INTEGER;
BEGIN
  -- Get current product
  SELECT * INTO v_product FROM products WHERE id = p_product_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found: %', p_product_id;
  END IF;
  
  -- Calculate new stock
  v_new_stock := v_product.stock + p_quantity_change;
  
  IF v_new_stock < 0 THEN
    RAISE EXCEPTION 'Stock cannot be negative. Current: %, Change: %', v_product.stock, p_quantity_change;
  END IF;
  
  -- Update product stock
  UPDATE products SET stock = v_new_stock WHERE id = p_product_id;
  
  -- Log adjustment
  INSERT INTO stock_adjustments (
    product_id, adjusted_by, quantity_change, stock_before, stock_after, note
  ) VALUES (
    p_product_id, p_adjusted_by, p_quantity_change, v_product.stock, v_new_stock, p_note
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SEED DATA (Optional - for testing)
-- =====================================================

-- Note: Uncomment below to insert sample data
-- This is useful for testing, but should be removed in production

/*
-- Sample Owner (password: password123)
INSERT INTO auth.users (id, email) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'owner@kasira.id')
ON CONFLICT DO NOTHING;

INSERT INTO profiles (id, name, role, business_name, package_type, status, expired_at) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Budi Hartono', 'owner', 'KASIRA Coffee', 'Pro', 'active', NOW() + INTERVAL '365 days')
ON CONFLICT DO NOTHING;

-- Sample Branch
INSERT INTO branches (id, name, location, owner_id) VALUES
  ('00000000-0000-0000-0000-000000000010', 'KASIRA Pusat', 'Jakarta Selatan', '00000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- Sample Kasir (password: password123)
INSERT INTO auth.users (id, email) VALUES 
  ('00000000-0000-0000-0000-000000000002', 'kasir@kasira.id')
ON CONFLICT DO NOTHING;

INSERT INTO profiles (id, name, role, branch_id) VALUES
  ('00000000-0000-0000-0000-000000000002', 'Siti Nurhaliza', 'kasir', '00000000-0000-0000-0000-000000000010')
ON CONFLICT DO NOTHING;

-- Sample Categories
INSERT INTO categories (name, branch_id) VALUES
  ('Coffee', '00000000-0000-0000-0000-000000000010'),
  ('Food', '00000000-0000-0000-0000-000000000010'),
  ('Pastry', '00000000-0000-0000-0000-000000000010')
ON CONFLICT DO NOTHING;

-- Sample Products
INSERT INTO products (name, category, price, cost_price, stock, branch_id, image_url) VALUES
  ('Espresso Single', 'Coffee', 15000, 5000, 50, '00000000-0000-0000-0000-000000000010', 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=500'),
  ('Cafe Latte', 'Coffee', 28000, 12000, 30, '00000000-0000-0000-0000-000000000010', 'https://images.unsplash.com/photo-1536939459926-301728717817?w=500'),
  ('Croissant Butter', 'Pastry', 22000, 8000, 15, '00000000-0000-0000-0000-000000000010', 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500')
ON CONFLICT DO NOTHING;
*/

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Verify tables
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;
