
import { createClient } from '@supabase/supabase-js';
import { User, Role, Branch, Product, Transaction, BranchPerformance, AccountStatus, PaymentStatus, PaymentRecord, Category } from '../types';
import { supabase, isDbConfigured } from './supabase';
import { realtime } from './realtime';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Mock Data untuk Demo Mode
const MOCK_USER: User = {
  id: 'demo-owner',
  name: 'Budi Hartono (Demo)',
  email: 'owner@kasira.id',
  role: Role.OWNER,
  businessName: 'KASIRA Coffee HQ',
  status: AccountStatus.ACTIVE,
  packageType: 'Pro Business',
  expiredAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
};

const MOCK_BRANCHES: Branch[] = [
  { id: 'b1', name: 'KASIRA Pusat - Jakarta', location: 'Sudirman, Jakarta', ownerId: 'demo-owner' },
  { id: 'b2', name: 'KASIRA Bandung', location: 'Dago, Bandung', ownerId: 'demo-owner' }
];

const MOCK_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Espresso Single', category: 'Coffee', price: 15000, costPrice: 5000, stock: 50, branchId: 'b1', imageUrl: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=500' },
  { id: 'p2', name: 'Cafe Latte', category: 'Coffee', price: 28000, costPrice: 12000, stock: 30, branchId: 'b1', imageUrl: 'https://images.unsplash.com/photo-1536939459926-301728717817?w=500' },
  { id: 'p3', name: 'Croissant Butter', category: 'Pastry', price: 22000, costPrice: 8000, stock: 15, branchId: 'b1', imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500' }
];

export const api = {
  // =====================================================
  // AUTHENTICATION
  // =====================================================

  login: async (email: string, password?: string): Promise<User | null> => {
    if (!isDbConfigured) {
      console.warn("API: Database not configured. Using Mock Login.");
      return MOCK_USER;
    }
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: password || 'password123',
      });
      if (authError) throw authError;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user!.id)
        .single();

      if (profileError) throw profileError;

      return {
        id: profile.id,
        name: profile.name,
        email: data.user!.email!,
        role: profile.role as Role,
        businessName: profile.business_name,
        status: profile.status as AccountStatus,
        packageType: profile.package_type,
        expiredAt: profile.expired_at,
        branchId: profile.branch_id
      };
    } catch (e: any) {
      console.error('Login error:', e);
      throw e;
    }
  },

  registerTrial: async (userData: any): Promise<User> => {
    if (!isDbConfigured) return MOCK_USER;

    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // 2. Create profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          name: userData.name,
          role: 'owner',
          business_name: userData.businessName,
          package_type: 'Trial',
          status: 'trial',
          expired_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days trial
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // 3. Create trial subscription
      await supabase.from('subscriptions').insert({
        user_id: authData.user.id,
        package: 'Trial',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active'
      });

      return {
        id: profile.id,
        name: profile.name,
        email: userData.email,
        role: Role.OWNER,
        businessName: profile.business_name,
        status: profile.status as AccountStatus,
        packageType: profile.package_type,
        expiredAt: profile.expired_at
      };
    } catch (e: any) {
      console.error('Registration error:', e);
      throw e;
    }
  },

  // =====================================================
  // BRANCHES MANAGEMENT (Owner Only)
  // =====================================================

  getBranches: async (ownerId: string): Promise<Branch[]> => {
    if (!isDbConfigured) return MOCK_BRANCHES;

    try {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((b: any) => ({
        id: b.id,
        name: b.name,
        location: b.location,
        ownerId: b.owner_id
      }));
    } catch (e: any) {
      console.error('Get branches error:', e);
      throw e;
    }
  },

  addBranch: async (branchData: any): Promise<Branch> => {
    if (!isDbConfigured) return { id: Math.random().toString(), ...branchData };

    try {
      const { data, error } = await supabase
        .from('branches')
        .insert({
          name: branchData.name,
          location: branchData.location,
          owner_id: branchData.ownerId
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        location: data.location,
        ownerId: data.owner_id
      };
    } catch (e: any) {
      console.error('Add branch error:', e);
      throw e;
    }
  },

  deleteBranch: async (id: string, role?: Role): Promise<{ success: boolean }> => {
    if (!isDbConfigured) return { success: true };

    // Only owners can delete branches
    if (role !== Role.OWNER) {
      throw new Error('Unauthorized: Only owners can delete branches');
    }

    try {
      const { error } = await supabase
        .from('branches')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { success: true };
    } catch (e: any) {
      console.error('Delete branch error:', e);
      throw e;
    }
  },

  // =====================================================
  // PRODUCTS MANAGEMENT
  // =====================================================

  getProducts: async (branchId?: string): Promise<Product[]> => {
    if (!isDbConfigured) return MOCK_PRODUCTS;

    try {
      let query = supabase.from('products').select('*');

      if (branchId && branchId !== 'all') {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        price: p.price,
        costPrice: p.cost_price,
        stock: p.stock,
        branchId: p.branch_id,
        imageUrl: p.image_url
      }));
    } catch (e: any) {
      console.error('Get products error:', e);
      throw e;
    }
  },

  addProduct: async (productData: any): Promise<Product> => {
    if (!isDbConfigured) return { id: Math.random().toString(), ...productData };

    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          name: productData.name,
          category: productData.category,
          price: productData.price,
          cost_price: productData.costPrice,
          stock: productData.stock,
          branch_id: productData.branchId,
          image_url: productData.imageUrl
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        category: data.category,
        price: data.price,
        costPrice: data.cost_price,
        stock: data.stock,
        branchId: data.branch_id,
        imageUrl: data.image_url
      };
    } catch (e: any) {
      console.error('Add product error:', e);
      throw e;
    }
  },

  updateProduct: async (id: string, productData: any, role?: Role): Promise<{ success: boolean }> => {
    if (!isDbConfigured) return { success: true };

    // Only owners can update products
    if (role !== Role.OWNER) {
      throw new Error('Unauthorized: Only owners can update products');
    }

    try {
      const { error } = await supabase
        .from('products')
        .update({
          name: productData.name,
          category: productData.category,
          price: productData.price,
          cost_price: productData.costPrice,
          stock: productData.stock,
          image_url: productData.imageUrl
        })
        .eq('id', id);

      if (error) throw error;

      return { success: true };
    } catch (e: any) {
      console.error('Update product error:', e);
      throw e;
    }
  },

  deleteProduct: async (id: string, role?: Role): Promise<{ success: boolean }> => {
    if (!isDbConfigured) return { success: true };

    // Only owners can delete products
    if (role !== Role.OWNER) {
      throw new Error('Unauthorized: Only owners can delete products');
    }

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { success: true };
    } catch (e: any) {
      console.error('Delete product error:', e);
      throw e;
    }
  },

  // =====================================================
  // CATEGORIES
  // =====================================================

  getCategories: async (branchId?: string): Promise<Category[]> => {
    if (!isDbConfigured) {
      return [
        { id: '1', name: 'Coffee', branchId: 'all' },
        { id: '2', name: 'Food', branchId: 'all' },
        { id: '3', name: 'Pastry', branchId: 'all' }
      ];
    }

    try {
      let query = supabase.from('categories').select('*');

      if (branchId && branchId !== 'all') {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        branchId: c.branch_id
      }));
    } catch (e: any) {
      console.error('Get categories error:', e);
      throw e;
    }
  },

  // =====================================================
  // STOCK MANAGEMENT (Owner Only)
  // =====================================================

  adjustStock: async (productId: string, amount: number, note?: string): Promise<{ success: boolean }> => {
    if (!isDbConfigured) return { success: true };

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Call database function for atomic stock adjustment
      const { data, error } = await supabase.rpc('adjust_stock_with_log', {
        p_product_id: productId,
        p_adjusted_by: user.id,
        p_quantity_change: amount,
        p_note: note || null
      });

      if (error) throw error;

      return { success: true };
    } catch (e: any) {
      console.error('Adjust stock error:', e);
      throw e;
    }
  },

  // =====================================================
  // TRANSACTIONS (Kasir & Owner)
  // =====================================================

  createTransaction: async (txData: any): Promise<Transaction> => {
    if (!isDbConfigured) {
      return {
        id: 'tx-mock-' + Date.now(),
        branchId: txData.branchId,
        cashierId: txData.cashierId,
        subtotal: txData.items.reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0),
        tax: txData.tax || 0,
        discount: 0,
        total: 0,
        status: 'success',
        paymentMethod: txData.paymentMethod,
        date: new Date().toISOString(),
        items: txData.items
      };
    }

    try {
      // Call database function for atomic transaction creation
      const { data, error } = await supabase.rpc('create_transaction_atomic', {
        p_branch_id: txData.branchId,
        p_cashier_id: txData.cashierId,
        p_items: txData.items, // Supabase client handles JSONB serialization automatically
        p_payment_method: txData.paymentMethod,
        p_bank: txData.bank || null,
        p_tax: txData.tax || 0,
        p_discount: txData.discount || 0
      });

      if (error) throw error;

      // Fetch transaction items
      const { data: items } = await supabase
        .from('transaction_items')
        .select('*')
        .eq('transaction_id', data.id);

      // Get ownerId for realtime update
      const { data: branch } = await supabase
        .from('branches')
        .select('owner_id')
        .eq('id', data.branchId)
        .single();

      const fullTransaction = {
        id: data.id,
        branchId: data.branchId,
        cashierId: data.cashierId,
        subtotal: data.subtotal,
        tax: data.tax,
        discount: data.discount,
        total: data.total,
        status: data.status as PaymentStatus,
        paymentMethod: data.paymentMethod,
        paymentDetails: data.paymentDetails,
        date: data.date,
        items: (items || []).map((i: any) => ({
          productId: i.product_id,
          name: i.name,
          quantity: i.quantity,
          price_snapshot: i.price_snapshot,
          cost_snapshot: i.cost_snapshot
        }))
      };

      // Trigger update to Owner Dashboard
      if (branch?.owner_id) {
        realtime.trigger(`owner.${branch.owner_id}`, 'TransactionCreated', fullTransaction);
      }

      return fullTransaction;

    } catch (e: any) {
      console.error('Create transaction error:', e);
      throw e;
    }
  },

  getTransactions: async (branchId: string): Promise<Transaction[]> => {
    if (!isDbConfigured) return [];

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, transaction_items(*)')
        .eq('branch_id', branchId)
        .order('date', { ascending: false })
        .limit(100);

      if (error) throw error;

      return (data || []).map((t: any) => ({
        id: t.id,
        branchId: t.branch_id,
        cashierId: t.cashier_id,
        subtotal: t.subtotal,
        tax: t.tax,
        discount: t.discount,
        total: t.total,
        status: t.status as PaymentStatus,
        paymentMethod: t.payment_method,
        paymentDetails: t.payment_details,
        date: t.date,
        items: (t.transaction_items || []).map((i: any) => ({
          productId: i.product_id,
          name: i.name,
          quantity: i.quantity,
          price_snapshot: i.price_snapshot,
          cost_snapshot: i.cost_snapshot
        }))
      }));
    } catch (e: any) {
      console.error('Get transactions error:', e);
      throw e;
    }
  },

  simulateMidtransCallback: async (transactionId: string, status: string): Promise<{ success: boolean }> => {
    if (!isDbConfigured) return { success: true };

    try {
      // Call database function to update payment status
      const { error } = await supabase.rpc('update_payment_status', {
        p_transaction_id: transactionId,
        p_status: status
      });

      if (error) throw error;

      // Trigger realtime event
      const { data: tx } = await supabase
        .from('transactions')
        .select('branch_id')
        .eq('id', transactionId)
        .single();

      if (tx) {
        realtime.trigger(`branch.${tx.branch_id}`, 'PaymentStatusUpdated', {
          transactionId,
          status
        });
      }

      return { success: true };
    } catch (e: any) {
      console.error('Simulate callback error:', e);
      throw e;
    }
  },

  getFinancialReport: async (params: { ownerId: string; branchId?: string; startDate: string; endDate: string }): Promise<{ transactions: Transaction[]; stats: any }> => {
    if (!isDbConfigured) {
      return {
        transactions: [],
        stats: { revenue: 0, cogs: 0, grossProfit: 0, netProfit: 0, totalDiscount: 0, totalTax: 0, orderCount: 0 }
      };
    }

    try {
      // Get all owner's branches
      const { data: branches } = await supabase
        .from('branches')
        .select('id')
        .eq('owner_id', params.ownerId);

      if (!branches || branches.length === 0) {
        return {
          transactions: [],
          stats: { revenue: 0, cogs: 0, grossProfit: 0, netProfit: 0, totalDiscount: 0, totalTax: 0, orderCount: 0 }
        };
      }

      const branchIds = branches.map((b: any) => b.id);

      // Build query
      let query = supabase
        .from('transactions')
        .select('*, transaction_items(*)')
        .in('branch_id', params.branchId && params.branchId !== 'all' ? [params.branchId] : branchIds)
        .gte('date', params.startDate)
        .lte('date', params.endDate)
        .order('date', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      const transactions: Transaction[] = (data || []).map((t: any) => ({
        id: t.id,
        branchId: t.branch_id,
        cashierId: t.cashier_id,
        subtotal: t.subtotal,
        tax: t.tax,
        discount: t.discount,
        total: t.total,
        status: t.status as PaymentStatus,
        paymentMethod: t.payment_method,
        paymentDetails: t.payment_details,
        date: t.date,
        items: (t.transaction_items || []).map((i: any) => ({
          productId: i.product_id,
          name: i.name,
          quantity: i.quantity,
          price_snapshot: i.price_snapshot,
          cost_snapshot: i.cost_snapshot
        }))
      }));

      // Calculate stats
      let revenue = 0;
      let cogs = 0;
      let totalDiscount = 0;
      let totalTax = 0;

      transactions.forEach(t => {
        revenue += t.subtotal;
        totalDiscount += t.discount;
        totalTax += t.tax;
        t.items.forEach((i: any) => {
          cogs += i.cost_snapshot * i.quantity;
        });
      });

      const grossProfit = revenue - cogs;
      const netProfit = grossProfit - totalDiscount;

      return {
        transactions,
        stats: {
          revenue,
          cogs,
          grossProfit,
          netProfit,
          totalDiscount,
          totalTax,
          orderCount: transactions.length
        }
      };

    } catch (e: any) {
      console.error('Get financial report error:', e);
      throw e;
    }
  },

  // =====================================================
  // STAFF MANAGEMENT (Owner Only)
  // =====================================================

  getStaff: async (ownerId: string): Promise<User[]> => {
    if (!isDbConfigured) return [];

    try {
      // Get all branches owned by this owner
      const { data: branches } = await supabase
        .from('branches')
        .select('id')
        .eq('owner_id', ownerId);

      if (!branches || branches.length === 0) return [];

      const branchIds = branches.map(b => b.id);

      // Get all staff in these branches
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'kasir')
        .in('branch_id', branchIds);

      if (error) throw error;

      return (data || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        email: s.email || '',
        role: Role.KASIR,
        branchId: s.branch_id
      }));
    } catch (e: any) {
      console.error('Get staff error:', e);
      throw e;
    }
  },




  addStaff: async (staffData: any): Promise<{ success: boolean }> => {
    if (!isDbConfigured) return { success: true };

    try {
      // Use Isolated Client for creating user to prevent session hijacking (logout)
      // We reconstruct the client just for this operation with non-persistent session
      const tempClient = createClient(
        (import.meta as any).env.VITE_SUPABASE_URL,
        (import.meta as any).env.VITE_SUPABASE_ANON_KEY,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
          }
        }
      );

      // Create auth user
      const { data: authData, error: authError } = await tempClient.auth.signUp({
        email: staffData.email,
        password: staffData.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // Create profile using Main Client (Owner Context)
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          name: staffData.name,
          role: 'kasir', // Hardcode role for safety
          branch_id: staffData.branchId,
          status: 'active'
        });

      if (profileError) throw profileError;

      return { success: true };
    } catch (e: any) {
      console.error('Add staff error:', e);
      throw e;
    }
  },



  deleteStaff: async (id: string, role?: Role): Promise<{ success: boolean }> => {
    if (!isDbConfigured) return { success: true };

    // Only owners can delete staff
    if (role !== Role.OWNER) {
      throw new Error('Unauthorized: Only owners can delete staff');
    }

    try {
      // Delete from auth.users will cascade to profiles
      const { error } = await supabase.auth.admin.deleteUser(id);

      if (error) throw error;

      return { success: true };
    } catch (e: any) {
      console.error('Delete staff error:', e);
      throw e;
    }
  },

  // =====================================================
  // REPORTS & ANALYTICS (Owner Only)
  // =====================================================



  getBranchComparison: async (ownerId: string, startDate: string, endDate?: string): Promise<BranchPerformance[]> => {
    if (!isDbConfigured) return [];

    try {
      // Get all branches
      const { data: branches } = await supabase
        .from('branches')
        .select('*')
        .eq('owner_id', ownerId);

      if (!branches) return [];

      const results: BranchPerformance[] = [];

      for (const branch of branches) {
        const report = await api.getFinancialReport({
          ownerId,
          branchId: branch.id,
          startDate,
          endDate: endDate || new Date().toISOString()
        });

        results.push({
          branchId: branch.id,
          branchName: branch.name,
          ...report.stats,
          bestSeller: 'N/A',
          trend: 'stable'
        });
      }

      return results;
    } catch (e: any) {
      console.error('Get branch comparison error:', e);
      throw e;
    }
  },

  // =====================================================
  // PAYMENT & SUBSCRIPTION
  // =====================================================

  initiateRegistration: async (paymentData: any): Promise<PaymentRecord> => {
    if (!isDbConfigured) {
      return {
        orderId: 'ORDER-' + Date.now(),
        amount: paymentData.amount,
        paymentType: paymentData.paymentType,
        status: 'pending'
      };
    }

    try {
      const orderId = 'ORDER-' + Date.now();

      const { data, error } = await supabase
        .from('payment_records')
        .insert({
          order_id: orderId,
          user_id: paymentData.userId,
          amount: paymentData.amount,
          payment_type: paymentData.paymentType,
          bank: paymentData.bank,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Generate VA or QRIS
      let paymentDetails: any = {};

      if (paymentData.paymentType === 'va') {
        paymentDetails.va_number = paymentData.bank + LPAD(Math.floor(Math.random() * 10000000000).toString(), 10, '0');
        paymentDetails.bank = paymentData.bank;
      } else {
        paymentDetails.qris_url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=QRIS_${orderId}`;
      }

      // Update with payment details
      await supabase
        .from('payment_records')
        .update(paymentDetails)
        .eq('id', data.id);

      return {
        orderId: data.order_id,
        amount: data.amount,
        paymentType: data.payment_type,
        bank: paymentDetails.bank,
        vaNumber: paymentDetails.va_number,
        qrisUrl: paymentDetails.qris_url,
        status: 'pending'
      };
    } catch (e: any) {
      console.error('Initiate registration error:', e);
      throw e;
    }
  },

  handleRegistrationCallback: async (orderId: string, status?: string): Promise<User> => {
    if (!isDbConfigured) return MOCK_USER;

    try {
      // Update payment record
      const { data: payment, error: paymentError } = await supabase
        .from('payment_records')
        .update({ status: status || 'paid' })
        .eq('order_id', orderId)
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Update user subscription
      const { data: profile } = await supabase
        .from('profiles')
        .update({
          status: 'active',
          package_type: 'Pro',
          expired_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', payment.user_id)
        .select()
        .single();

      return {
        id: profile.id,
        name: profile.name,
        email: '',
        role: Role.OWNER,
        businessName: profile.business_name,
        status: profile.status as AccountStatus,
        packageType: profile.package_type,
        expiredAt: profile.expired_at
      };
    } catch (e: any) {
      console.error('Handle registration callback error:', e);
      throw e;
    }
  },

  // =====================================================
  // AI ANALYSIS
  // =====================================================

  getAIAnalysis: async (data: any) => {
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        return "Gunakan strategi bundle produk untuk meningkatkan basket size dan optimalkan jam operasional pada waktu sibuk.";
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

      const prompt = `Kamu adalah konsultan bisnis UMKM yang ahli. Analisis data bisnis POS berikut:
      
Omzet: Rp${data.stats.revenue.toLocaleString('id-ID')}
Laba Bersih: Rp${data.stats.netProfit.toLocaleString('id-ID')}
COGS: Rp${data.stats.cogs.toLocaleString('id-ID')}
Jumlah Transaksi: ${data.stats.orderCount}

Berikan 3 saran strategis yang konkret dan dapat langsung diterapkan untuk meningkatkan performa bisnis. Gunakan Bahasa Indonesia, jawab dengan singkat dan padat (maksimal 3 kalimat per saran).`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (e) {
      console.error('AI Analysis error:', e);
      return "Gunakan strategi bundle produk untuk meningkatkan basket size dan optimalkan jam operasional pada waktu sibuk.";
    }
  }
};

// Helper function
function LPAD(str: string, length: number, char: string): string {
  return str.padStart(length, char);
}
