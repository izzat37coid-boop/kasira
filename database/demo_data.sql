-- =====================================================
-- KASIRA POS - Demo Data untuk Presentasi
-- Run setelah migrations.sql
-- =====================================================

-- Demo Owner Account
-- Email: owner@demo.com
-- Password: demo123
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'authenticated',
  'authenticated',
  'owner@demo.com',
  crypt('demo123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, name, role, business_name, package_type, status, expired_at) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Demo Owner', 'owner', 'KASIRA Coffee Demo', 'Pro', 'active', NOW() + INTERVAL '365 days')
ON CONFLICT (id) DO NOTHING;

-- Demo Branch
INSERT INTO branches (id, name, location, owner_id) VALUES
  ('22222222-2222-2222-2222-222222222222', 'KASIRA Pusat', 'Jakarta Selatan', '11111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;

-- Demo Kasir Account
-- Email: kasir@demo.com
-- Password: demo123
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '33333333-3333-3333-3333-333333333333',
  'authenticated',
  'authenticated',
  'kasir@demo.com',
  crypt('demo123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, name, role, branch_id) VALUES
  ('33333333-3333-3333-3333-333333333333', 'Demo Kasir', 'kasir', '22222222-2222-2222-2222-222222222222')
ON CONFLICT (id) DO NOTHING;

-- Demo Categories
INSERT INTO categories (name, branch_id) VALUES
  ('Coffee', '22222222-2222-2222-2222-222222222222'),
  ('Food', '22222222-2222-2222-2222-222222222222'),
  ('Pastry', '22222222-2222-2222-2222-222222222222')
ON CONFLICT DO NOTHING;

-- Demo Products (8 produk dengan gambar)
INSERT INTO products (name, category, price, cost_price, stock, branch_id, image_url) VALUES
  ('Espresso', 'Coffee', 15000, 5000, 100, '22222222-2222-2222-2222-222222222222', 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=500'),
  ('Cappuccino', 'Coffee', 25000, 10000, 80, '22222222-2222-2222-2222-222222222222', 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=500'),
  ('Cafe Latte', 'Coffee', 28000, 12000, 75, '22222222-2222-2222-2222-222222222222', 'https://images.unsplash.com/photo-1536939459926-301728717817?w=500'),
  ('Americano', 'Coffee', 20000, 8000, 90, '22222222-2222-2222-2222-222222222222', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500'),
  ('Nasi Goreng', 'Food', 35000, 15000, 50, '22222222-2222-2222-2222-222222222222', 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500'),
  ('Mie Goreng', 'Food', 30000, 12000, 45, '22222222-2222-2222-2222-222222222222', 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500'),
  ('Croissant', 'Pastry', 22000, 8000, 30, '22222222-2222-2222-2222-222222222222', 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500'),
  ('Donut', 'Pastry', 18000, 6000, 40, '22222222-2222-2222-2222-222222222222', 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=500')
ON CONFLICT DO NOTHING;

-- Verify Data
SELECT 'Demo data inserted successfully!' as status;
SELECT 'Owner: owner@demo.com / demo123' as credentials;
SELECT 'Kasir: kasir@demo.com / demo123' as credentials;
SELECT COUNT(*) as total_products FROM products;
SELECT COUNT(*) as total_users FROM profiles;
