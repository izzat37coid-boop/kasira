
import { User, Role, Branch, Product, Transaction, Category, BranchPerformance, AccountStatus, PaymentStatus, PaymentRecord } from '../types';
import { supabase } from './supabase';
import { realtime } from './realtime';
import { GoogleGenAI } from "@google/genai";

export const api = {
  /**
   * AUTHENTICATION
   */
  login: async (email: string, password?: string): Promise<User | null> => {
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: password || 'password123', 
      });

      if (authError) throw authError;
      if (!data.user) return null;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) return null;

      return {
        id: profile.id,
        name: profile.name,
        email: data.user.email!,
        role: profile.role as Role,
        businessName: profile.business_name,
        status: profile.status as AccountStatus,
        packageType: profile.package_type,
        expiredAt: profile.expired_at,
        branchId: profile.branch_id
      };
    } catch (e: any) {
      console.error("Login failed:", e.message);
      throw e;
    }
  },

  registerTrial: async (data: any): Promise<User> => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Registrasi gagal.");

      const profileData = {
        id: authData.user.id,
        name: data.name,
        role: Role.OWNER,
        business_name: data.businessName,
        status: AccountStatus.TRIAL,
        package_type: 'Trial',
        expired_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .insert(profileData);

      if (profileError) throw profileError;

      return {
        ...profileData,
        email: data.email,
        role: Role.OWNER,
        businessName: data.businessName,
        status: AccountStatus.TRIAL,
        packageType: 'Trial',
        expiredAt: profileData.expired_at
      };
    } catch (e: any) {
      console.error("Registration failed:", e.message);
      throw e;
    }
  },

  /**
   * BRANCH MANAGEMENT
   */
  getBranches: async (ownerId: string): Promise<Branch[]> => {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('owner_id', ownerId);
    
    if (error) throw error;
    return (data || []).map(b => ({
      id: b.id,
      name: b.name,
      location: b.location,
      ownerId: b.owner_id
    }));
  },

  addBranch: async (data: any) => {
    const { data: newBranch, error } = await supabase
      .from('branches')
      .insert({
        name: data.name,
        location: data.location,
        owner_id: data.ownerId
      })
      .select()
      .single();

    if (error) throw error;
    return newBranch;
  },

  deleteBranch: async (id: string, role: Role) => {
    if (role !== Role.OWNER) throw new Error("Unauthorized");
    const { error } = await supabase.from('branches').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  },

  /**
   * PRODUCT MANAGEMENT
   */
  getProducts: async (branchId?: string): Promise<Product[]> => {
    let query = supabase.from('products').select('*');
    if (branchId && branchId !== 'all') {
      query = query.eq('branch_id', branchId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    return (data || []).map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.price,
      costPrice: p.cost_price,
      stock: p.stock,
      branchId: p.branch_id,
      imageUrl: p.image_url
    }));
  },

  addProduct: async (data: any) => {
    const { data: product, error } = await supabase
      .from('products')
      .insert({
        name: data.name,
        category: data.category,
        price: Number(data.price),
        cost_price: Number(data.costPrice),
        stock: Number(data.stock),
        branch_id: data.branchId,
        image_url: data.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500'
      })
      .select()
      .single();

    if (error) throw error;
    return product;
  },

  updateProduct: async (id: string, data: any, role: Role) => {
    if (role !== Role.OWNER) throw new Error("Unauthorized");
    const { error } = await supabase
      .from('products')
      .update({
        name: data.name,
        category: data.category,
        price: Number(data.price),
        cost_price: Number(data.costPrice),
        stock: Number(data.stock),
        branch_id: data.branchId,
        image_url: data.imageUrl
      })
      .eq('id', id);
    if (error) throw error;
    return { success: true };
  },

  deleteProduct: async (id: string, role: Role) => {
    if (role !== Role.OWNER) throw new Error("Unauthorized");
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  },

  getCategories: async (): Promise<any[]> => {
    const { data, error } = await supabase.from('products').select('category');
    if (error) throw error;
    const unique = Array.from(new Set((data || []).map(p => p.category)));
    return unique.map((name, id) => ({ id: String(id), name }));
  },

  /**
   * STAFF MANAGEMENT
   */
  getStaff: async (ownerId: string): Promise<User[]> => {
    const branches = await api.getBranches(ownerId);
    const branchIds = branches.map(b => b.id);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', Role.KASIR)
      .in('branch_id', branchIds);
    if (error) throw error;
    return (data || []).map(p => ({
      id: p.id,
      name: p.name,
      email: p.email || 'kasir@kasira.id',
      role: Role.KASIR,
      branchId: p.branch_id
    }));
  },

  addStaff: async (data: any) => {
    const { error } = await supabase.from('profiles').insert({
      id: Math.random().toString(36).substr(2, 9),
      name: data.name,
      role: Role.KASIR,
      branch_id: data.branchId,
      status: AccountStatus.ACTIVE
    });
    if (error) throw error;
    return { success: true };
  },

  deleteStaff: async (id: string, role: Role) => {
    if (role !== Role.OWNER) throw new Error("Unauthorized");
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  },

  /**
   * TRANSACTION
   */
  createTransaction: async (data: any): Promise<Transaction> => {
    const { data: tx, error: txError } = await supabase
      .from('transactions')
      .insert({
        branch_id: data.branchId,
        cashier_id: data.cashierId,
        subtotal: data.subtotal || 0,
        tax: data.tax || 0,
        discount: data.discount || 0,
        total: data.total || 0,
        status: data.paymentMethod === 'CASH' ? 'success' : 'pending',
        payment_method: data.paymentMethod,
        payment_details: data.paymentDetails
      })
      .select()
      .single();

    if (txError) throw txError;

    for (const item of data.items) {
      const { data: prod } = await supabase.from('products').select('*').eq('id', item.productId).single();
      
      await supabase.from('transaction_items').insert({
        transaction_id: tx.id,
        product_id: item.productId,
        name: prod.name,
        quantity: item.quantity,
        price_snapshot: prod.price,
        cost_snapshot: prod.cost_price
      });

      await supabase
        .from('products')
        .update({ stock: prod.stock - item.quantity })
        .eq('id', item.productId);
    }

    realtime.broadcast(`owner.${data.ownerId}`, 'TransactionCreated', tx);

    return {
      id: tx.id,
      branchId: tx.branch_id,
      cashierId: tx.cashier_id,
      subtotal: tx.subtotal,
      tax: tx.tax,
      discount: tx.discount,
      total: tx.total,
      status: tx.status as PaymentStatus,
      paymentMethod: tx.payment_method,
      date: tx.created_at,
      items: [] 
    };
  },

  getTransactions: async (branchId: string): Promise<Transaction[]> => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*, transaction_items(*)')
      .eq('branch_id', branchId);
    if (error) throw error;
    return (data || []).map(t => ({
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
      date: t.created_at,
      items: t.transaction_items.map((ti: any) => ({
        productId: ti.product_id,
        name: ti.name,
        quantity: ti.quantity,
        price_snapshot: ti.price_snapshot,
        cost_snapshot: ti.cost_snapshot
      }))
    }));
  },

  simulateMidtransCallback: async (txId: string, status: string) => {
    const { error } = await supabase.from('transactions').update({ status }).eq('id', txId);
    if (error) throw error;
    const { data: tx } = await supabase.from('transactions').select('branch_id').eq('id', txId).single();
    if (tx) {
      realtime.broadcast(`branch.${tx.branch_id}`, 'PaymentStatusUpdated', { status, transactionId: txId });
    }
  },

  /**
   * STOCK MANAGEMENT
   */
  adjustStock: async (productId: string, amount: number, note: string) => {
    const { data: prod } = await supabase.from('products').select('stock, branch_id').eq('id', productId).single();
    if (!prod) throw new Error("Produk tidak ditemukan.");
    const { error } = await supabase.from('products').update({ stock: prod.stock + amount }).eq('id', productId);
    if (error) throw error;
    realtime.broadcast(`branch.${prod.branch_id}`, 'StockUpdated', {});
    return { success: true };
  },

  /**
   * REPORTS & ANALYSIS
   */
  getFinancialReport: async (filters: any) => {
    let query = supabase
      .from('transactions')
      .select('*, transaction_items(*)')
      .eq('status', 'success');

    if (filters.branchId && filters.branchId !== 'all') {
      query = query.eq('branch_id', filters.branchId);
    }
    if (filters.startDate) query = query.gte('created_at', filters.startDate);
    if (filters.endDate) query = query.lte('created_at', filters.endDate);

    const { data: txs, error } = await query;
    if (error) throw error;

    const stats = (txs || []).reduce((acc: any, t: any) => {
      const cogs = t.transaction_items.reduce((sum: number, item: any) => sum + (item.cost_snapshot * item.quantity), 0);
      acc.revenue += t.subtotal;
      acc.cogs += cogs;
      acc.totalDiscount += t.discount;
      acc.totalTax += t.tax;
      acc.orderCount += 1;
      return acc;
    }, { revenue: 0, cogs: 0, grossProfit: 0, netProfit: 0, totalDiscount: 0, totalTax: 0, orderCount: 0 });

    stats.grossProfit = stats.revenue - stats.cogs;
    stats.netProfit = stats.grossProfit - stats.totalDiscount;

    return { 
      transactions: (txs || []).map((t: any) => ({
        id: t.id,
        branchId: t.branch_id,
        cashierId: t.cashier_id,
        subtotal: t.subtotal,
        tax: t.tax,
        discount: t.discount,
        total: t.total,
        status: t.status,
        paymentMethod: t.payment_method,
        date: t.created_at,
        items: t.transaction_items
      })), 
      stats 
    };
  },

  getBranchComparison: async (ownerId: string, startDate: string, endDate?: string): Promise<BranchPerformance[]> => {
    const branches = await api.getBranches(ownerId);
    const results: BranchPerformance[] = [];

    for (const branch of branches) {
      const { stats } = await api.getFinancialReport({ branchId: branch.id, startDate, endDate });
      results.push({
        ...stats,
        branchId: branch.id,
        branchName: branch.name,
        bestSeller: 'Menu Terlaris',
        trend: 'stable'
      });
    }
    return results;
  },

  getAIAnalysis: async (data: any) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Analisis data bisnis POS ini: 
      Omzet: Rp${data.stats.revenue.toLocaleString()}, 
      Laba: Rp${data.stats.netProfit.toLocaleString()}, 
      Transaksi: ${data.stats.orderCount}. 
      Berikan 3 saran strategis UMKM dalam Bahasa Indonesia yang sangat singkat (maksimal 2 kalimat per poin).`;

    try {
      const response = await api.generateAIContent(prompt);
      return response;
    } catch (error) {
      console.error("AI Analysis Error:", error);
      return "Analisis AI sedang sibuk. Silakan coba beberapa saat lagi.";
    }
  },

  // Helper untuk memanggil Gemini dengan instance baru setiap saat (sesuai best practice)
  generateAIContent: async (prompt: string) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });
    return response.text;
  },

  initiateRegistration: async (data: any): Promise<PaymentRecord> => {
    const orderId = `REG-${Math.random().toString(36).substr(2, 9)}`;
    const amount = data.package === 'Pro' ? 199000 : 1900000;
    return {
      orderId,
      amount,
      paymentType: 'qris',
      qrisUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=KASIRA-PAYMENT',
      status: 'pending'
    };
  },

  handleRegistrationCallback: async (orderId: string, status: string): Promise<User | null> => {
    const { data: profile } = await supabase.from('profiles').select('*').limit(1).single();
    if (!profile) return null;
    
    await supabase.from('profiles').update({ status: AccountStatus.ACTIVE }).eq('id', profile.id);
    
    return {
      id: profile.id,
      name: profile.name,
      email: 'user@kasira.id',
      role: profile.role as Role,
      businessName: profile.business_name,
      status: AccountStatus.ACTIVE,
      packageType: profile.package_type,
      expiredAt: profile.expired_at,
    };
  }
};
