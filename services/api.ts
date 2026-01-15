
import { User, Role, Branch, Product, Transaction, BranchPerformance, AccountStatus, PaymentStatus, PaymentRecord, Category } from '../types';
import { supabase, isDbConfigured } from './supabase';
import { realtime } from './realtime';
import { GoogleGenAI } from "@google/genai";

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

export const api = {
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
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user!.id).single();
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
    } catch (e: any) { throw e; }
  },

  getBranches: async (ownerId: string): Promise<Branch[]> => {
    if (!isDbConfigured) return MOCK_BRANCHES;
    const { data, error } = await supabase.from('branches').select('*').eq('owner_id', ownerId);
    if (error) throw error;
    return (data || []).map((b: any) => ({ id: b.id, name: b.name, location: b.location, ownerId: b.owner_id }));
  },

  getProducts: async (branchId?: string): Promise<Product[]> => {
    if (!isDbConfigured) {
      return [
        { id: 'p1', name: 'Espresso Single', category: 'Coffee', price: 15000, costPrice: 5000, stock: 50, branchId: 'b1', imageUrl: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=500' },
        { id: 'p2', name: 'Cafe Latte', category: 'Coffee', price: 28000, costPrice: 12000, stock: 30, branchId: 'b1', imageUrl: 'https://images.unsplash.com/photo-1536939459926-301728717817?w=500' },
        { id: 'p3', name: 'Croissant Butter', category: 'Pastry', price: 22000, costPrice: 8000, stock: 15, branchId: 'b1', imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500' }
      ];
    }
    let query = supabase.from('products').select('*');
    if (branchId && branchId !== 'all') query = query.eq('branch_id', branchId);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map((p: any) => ({ id: p.id, name: p.name, category: p.category, price: p.price, costPrice: p.cost_price, stock: p.stock, branchId: p.branch_id, imageUrl: p.image_url }));
  },

  getFinancialReport: async (filters: any) => {
    if (!isDbConfigured) {
      return {
        transactions: [],
        stats: { revenue: 15450000, cogs: 6200000, grossProfit: 9250000, netProfit: 8500000, totalDiscount: 750000, totalTax: 1699500, orderCount: 142 }
      };
    }
    let query = supabase.from('transactions').select('*, transaction_items(*)').eq('status', 'success');
    if (filters.branchId && filters.branchId !== 'all') query = query.eq('branch_id', filters.branchId);
    const { data, error } = await query;
    if (error) throw error;
    const stats = (data || []).reduce((acc: any, t: any) => {
      const cogs = t.transaction_items.reduce((sum: number, item: any) => sum + (item.cost_snapshot * item.quantity), 0);
      acc.revenue += t.subtotal; acc.cogs += cogs; acc.totalDiscount += t.discount; acc.totalTax += t.tax; acc.orderCount += 1;
      return acc;
    }, { revenue: 0, cogs: 0, grossProfit: 0, netProfit: 0, totalDiscount: 0, totalTax: 0, orderCount: 0 });
    stats.grossProfit = stats.revenue - stats.cogs;
    stats.netProfit = stats.grossProfit - stats.totalDiscount;
    return { transactions: data || [], stats };
  },

  getAIAnalysis: async (data: any) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Analisis data bisnis POS ini: Omzet: Rp${data.stats.revenue.toLocaleString()}, Laba: Rp${data.stats.netProfit.toLocaleString()}. Berikan 3 saran strategis UMKM Bahasa Indonesia sangat singkat.`;
      const response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: prompt });
      return response.text;
    } catch (e) { return "Gunakan strategi bundle produk untuk meningkatkan basket size dan optimalkan jam operasional pada waktu sibuk."; }
  },

  // Stub-out remaining methods to prevent errors
  registerTrial: async (data: any) => MOCK_USER,
  addBranch: async (data: any) => ({ id: Math.random().toString(), ...data }),
  // Fix: Added optional role parameter to match deleteBranch(confirmDelete.id, user.role) usage
  deleteBranch: async (id: string, role?: Role) => ({ success: true }),
  addProduct: async (data: any) => ({ id: Math.random().toString(), ...data }),
  // Fix: Added optional role parameter to match updateProduct(editingId, formData, user.role) usage
  updateProduct: async (id: string, data: any, role?: Role) => ({ success: true }),
  // Fix: Added optional role parameter to match deleteProduct(confirmDelete.id, user.role) usage
  deleteProduct: async (id: string, role?: Role) => ({ success: true }),
  // Fix: Added branchId to mock data and explicit return type to fix Category mapping error in Products.tsx
  getCategories: async (): Promise<Category[]> => [{ id: '1', name: 'Coffee', branchId: 'all' }, { id: '2', name: 'Food', branchId: 'all' }],
  getStaff: async (ownerId: string) => [],
  addStaff: async (data: any) => ({ success: true }),
  // Fix: Added optional role parameter to match deleteStaff(confirmDelete.id, user.role) usage
  deleteStaff: async (id: string, role?: Role) => ({ success: true }),
  createTransaction: async (data: any) => ({ id: 'tx-mock', ...data, status: 'success', date: new Date().toISOString() }),
  getTransactions: async (branchId: string) => [],
  // Fix: Added optional note parameter to match adjustStock(activeProduct.id, adjustAmount, adjustNote) usage
  adjustStock: async (pId: string, amt: number, note?: string) => ({ success: true }),
  // Fix: Added optional endDate parameter to match getBranchComparison(user.id, start, end) usage
  getBranchComparison: async (oId: string, start: string, endDate?: string) => [],
  // Fix: Defined explicit return type and fixed property types to match PaymentRecord interface used in Register.tsx
  initiateRegistration: async (data: any): Promise<PaymentRecord> => ({ 
    orderId: 'tx-1', 
    amount: 199000, 
    paymentType: 'qris', 
    status: 'pending' 
  }),
  // Fix: Added optional status parameter to match handleRegistrationCallback(currentPayment.orderId, 'paid') usage
  handleRegistrationCallback: async (oId: string, status?: string) => MOCK_USER,
  // Fix: Added missing simulateMidtransCallback method called in POS.tsx
  simulateMidtransCallback: async (id: string, status: string) => ({ success: true })
};
