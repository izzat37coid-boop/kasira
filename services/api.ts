
import { User, Role, Branch, Product, Transaction, Category, BranchPerformance, AccountStatus, PaymentStatus, PaymentRecord, TransactionItem } from '../types';
import { realtime } from './realtime';
import { GoogleGenAI } from "@google/genai";

// KONFIGURASI API PRODUKSI
const API_BASE_URL = 'https://api.kasira.id/api'; // Ganti dengan URL Laravel Anda
const IS_PRODUCTION = false; // Ubah ke true jika ingin koneksi ke MySQL/Laravel asli

const DB_PREFIX = 'kasira_db_';

// Helper untuk LocalStorage (Fallback Mode Demo)
const save = (key: string, data: any) => localStorage.setItem(DB_PREFIX + key, JSON.stringify(data));
const load = (key: string, fallback: any) => {
  const data = localStorage.getItem(DB_PREFIX + key);
  return data ? JSON.parse(data) : fallback;
};

// Mock Users untuk Demo
let users: User[] = load('users', [
  { id: 'u1', name: 'Budi Hartono', email: 'owner@kasira.com', role: Role.OWNER, businessName: 'Kasira Retail Group', status: AccountStatus.ACTIVE, packageType: 'Pro', expiredAt: '2026-12-31T23:59:59Z' },
  { id: 'u2', name: 'Andi Pratama', email: 'kasir@kasira.com', role: Role.KASIR, branchId: 'b1' }
]);

const uuid = () => Math.random().toString(36).substr(2, 9).toUpperCase();

// Helper Fetch (Untuk Laravel Sanctum)
async function request(endpoint: string, options: RequestInit = {}) {
  if (!IS_PRODUCTION) return null; // Jika mode demo, lewatkan

  const token = localStorage.getItem('kasira_token');
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) throw new Error('API Request Failed');
  return response.json();
}

export const api = {
  /**
   * AUTHENTICATION
   */
  login: async (email: string): Promise<User | null> => {
    if (IS_PRODUCTION) {
      const res = await request('/login', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      return res?.user;
    }
    
    // Demo Mode logic
    const user = users.find(u => u.email === email);
    if (user && user.role === Role.OWNER && user.expiredAt) {
      if (new Date(user.expiredAt) < new Date()) {
        user.status = AccountStatus.EXPIRED;
        save('users', users);
      }
    }
    return user || null;
  },

  registerTrial: async (data: any): Promise<User> => {
    const newUser: User = {
      id: uuid(),
      name: data.name,
      email: data.email,
      role: Role.OWNER,
      businessName: data.businessName,
      status: AccountStatus.TRIAL,
      packageType: 'Trial',
      expiredAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };
    users.push(newUser);
    save('users', users);
    return newUser;
  },

  initiateRegistration: async (data: any): Promise<PaymentRecord> => {
    const amount = data.package === 'Pro' ? 199000 : 1900000;
    const payment: PaymentRecord = {
      orderId: `REG-${uuid()}`,
      amount,
      paymentType: 'qris',
      qrisUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=PAY-${uuid()}`,
      status: 'pending'
    };
    return payment;
  },

  handleRegistrationCallback: async (orderId: string, status: 'paid' | 'failed'): Promise<User | null> => {
    const user = users[users.length - 1];
    if (user && status === 'paid') {
      user.status = AccountStatus.ACTIVE;
      save('users', users);
      return user;
    }
    return null;
  },

  /**
   * BRANCH MANAGEMENT
   */
  getBranches: async (ownerId: string): Promise<Branch[]> => {
    if (IS_PRODUCTION) return request(`/branches?owner_id=${ownerId}`);
    return load('branches', []).filter((b: Branch) => b.ownerId === ownerId);
  },

  addBranch: async (data: any) => {
    if (IS_PRODUCTION) return request('/branches', { method: 'POST', body: JSON.stringify(data) });
    const branches = load('branches', []);
    const newBranch = { ...data, id: uuid() };
    branches.push(newBranch);
    save('branches', branches);
    return newBranch;
  },

  deleteBranch: async (id: string, role: Role) => {
    if (role !== Role.OWNER) throw new Error("Unauthorized");
    const branches = load('branches', []);
    const filtered = branches.filter((b: Branch) => b.id !== id);
    save('branches', filtered);
    return { success: true };
  },

  /**
   * PRODUCT MANAGEMENT
   */
  getProducts: async (branchId?: string): Promise<Product[]> => {
    if (IS_PRODUCTION) return request(`/products${branchId ? `?branch_id=${branchId}` : ''}`);
    const p = load('products', []);
    if (branchId && branchId !== 'all') return p.filter((item: Product) => item.branchId === branchId);
    return p;
  },

  getCategories: async (): Promise<Category[]> => {
    return load('categories', [
      { id: 'c1', name: 'Makanan', branchId: 'all' },
      { id: 'c2', name: 'Minuman', branchId: 'all' }
    ]);
  },

  addProduct: async (data: any) => {
    if (IS_PRODUCTION) return request('/products', { method: 'POST', body: JSON.stringify(data) });
    const products = load('products', []);
    const newProduct = { 
      ...data, 
      id: uuid(), 
      price: Number(data.price), 
      costPrice: Number(data.costPrice), 
      stock: Number(data.stock),
      imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500'
    };
    products.push(newProduct);
    save('products', products);
    return newProduct;
  },

  updateProduct: async (id: string, data: any, role: Role) => {
    if (role !== Role.OWNER) throw new Error("Unauthorized");
    const products = load('products', []);
    const idx = products.findIndex((p: Product) => p.id === id);
    if (idx !== -1) {
      products[idx] = { ...products[idx], ...data, price: Number(data.price), costPrice: Number(data.costPrice), stock: Number(data.stock) };
      save('products', products);
    }
    return products[idx];
  },

  deleteProduct: async (id: string, role: Role) => {
    if (role !== Role.OWNER) throw new Error("Unauthorized");
    const products = load('products', []);
    const filtered = products.filter((p: Product) => p.id !== id);
    save('products', filtered);
    return { success: true };
  },

  /**
   * STAFF MANAGEMENT
   */
  getStaff: async (ownerId: string): Promise<User[]> => {
    return users.filter(u => u.role === Role.KASIR);
  },

  addStaff: async (data: any) => {
    const newStaff: User = {
      id: uuid(),
      name: data.name,
      email: data.email,
      role: Role.KASIR,
      branchId: data.branchId
    };
    users.push(newStaff);
    save('users', users);
    return newStaff;
  },

  deleteStaff: async (id: string, role: Role) => {
    if (role !== Role.OWNER) throw new Error("Unauthorized");
    users = users.filter(u => u.id !== id);
    save('users', users);
    return { success: true };
  },

  /**
   * TRANSACTION & POS
   */
  getTransactions: async (branchId: string): Promise<Transaction[]> => {
    const tx = load('transactions', []);
    return tx.filter((t: Transaction) => t.branchId === branchId);
  },

  createTransaction: async (data: any): Promise<Transaction> => {
    if (IS_PRODUCTION) return request('/transactions', { method: 'POST', body: JSON.stringify(data) });
    
    const products = load('products', []);
    const transactions = load('transactions', []);
    
    const items = data.items.map((item: any) => {
      const p = products.find((prod: Product) => prod.id === item.productId);
      if (p) p.stock -= item.quantity;
      return { ...item, name: p?.name, price_snapshot: p?.price, cost_snapshot: p?.costPrice };
    });

    save('products', products);

    const newTx: Transaction = {
      id: `TX-${uuid()}`,
      branchId: data.branchId,
      cashierId: data.cashierId,
      subtotal: items.reduce((acc: number, i: any) => acc + (i.price_snapshot * i.quantity), 0),
      tax: data.tax || 0,
      discount: data.discount || 0,
      total: 0,
      status: data.paymentMethod === 'CASH' ? 'success' : 'pending',
      paymentMethod: data.paymentMethod,
      date: new Date().toISOString(),
      items: items,
      paymentDetails: data.paymentMethod === 'TRANSFER' ? { bank: data.bank, va_number: `8800${Math.floor(Math.random() * 10000000)}` } : undefined
    };
    newTx.total = newTx.subtotal + newTx.tax - newTx.discount;

    if (data.paymentMethod === 'QRIS') {
      newTx.paymentDetails = { qris_url: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=KASIRA-${newTx.id}` };
    }

    transactions.push(newTx);
    save('transactions', transactions);
    
    realtime.broadcast(`owner.${users.find(u => u.role === Role.OWNER)?.id}`, 'TransactionCreated', newTx);
    
    return newTx;
  },

  simulateMidtransCallback: async (transactionId: string, status: PaymentStatus) => {
    const transactions = load('transactions', []);
    const tx = transactions.find((t: Transaction) => t.id === transactionId);
    if (tx) {
      tx.status = status;
      save('transactions', transactions);
      realtime.broadcast(`branch.${tx.branchId}`, 'PaymentStatusUpdated', { status, transactionId });
    }
  },

  /**
   * STOCK MANAGEMENT
   */
  adjustStock: async (productId: string, amount: number, note: string) => {
    const products = load('products', []);
    const p = products.find((prod: Product) => prod.id === productId);
    if (p) {
      p.stock += amount;
      save('products', products);
      realtime.broadcast(`branch.${p.branchId}`, 'StockUpdated', { productId });
    }
    return { success: true };
  },

  /**
   * AI ANALYSIS (GEMINI 3 PRO)
   */
  getAIAnalysis: async (data: any) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const prompt = `Analisis data bisnis POS ini: 
      Omzet: Rp${data.stats.revenue.toLocaleString()}, 
      Laba: Rp${data.stats.netProfit.toLocaleString()}, 
      Transaksi: ${data.stats.orderCount}. 
      Berikan 3 saran strategis UMKM dalam Bahasa Indonesia yang sangat singkat.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
      });
      return response.text;
    } catch (error) {
      return "Saran AI tidak tersedia saat ini.";
    }
  },

  getFinancialReport: async (filters: any) => {
    if (IS_PRODUCTION) return request('/reports/financial', { method: 'POST', body: JSON.stringify(filters) });
    
    let tx = load('transactions', []).filter((t: Transaction) => {
      const isDateMatch = (!filters.startDate || t.date >= filters.startDate) && (!filters.endDate || t.date <= filters.endDate);
      const isBranchMatch = !filters.branchId || filters.branchId === 'all' || t.branchId === filters.branchId;
      return t.status === 'success' && isDateMatch && isBranchMatch;
    });

    const stats = tx.reduce((acc: any, t: Transaction) => {
      const cogs = t.items.reduce((sum: number, item: TransactionItem) => sum + (item.cost_snapshot * item.quantity), 0);
      acc.revenue += t.subtotal;
      acc.cogs += cogs;
      acc.totalDiscount += t.discount;
      acc.totalTax += t.tax;
      acc.orderCount += 1;
      return acc;
    }, { revenue: 0, cogs: 0, grossProfit: 0, netProfit: 0, totalDiscount: 0, totalTax: 0, orderCount: 0 });

    stats.grossProfit = stats.revenue - stats.cogs;
    stats.netProfit = stats.grossProfit - stats.totalDiscount;

    return { transactions: tx, stats };
  },

  getBranchComparison: async (ownerId: string, startDate?: string, endDate?: string): Promise<BranchPerformance[]> => {
    if (IS_PRODUCTION) return request(`/reports/branches?owner_id=${ownerId}`);
    
    const branches = load('branches', []).filter((b: Branch) => b.ownerId === ownerId);
    const allTxs = load('transactions', []).filter((t: Transaction) => {
      const isDateMatch = (!startDate || t.date >= startDate) && (!endDate || t.date <= endDate);
      return t.status === 'success' && isDateMatch;
    });

    return branches.map((b: Branch) => {
      const branchTxs = allTxs.filter((t: Transaction) => t.branchId === b.id);
      const stats = branchTxs.reduce((acc: any, t: Transaction) => {
        const cogs = t.items.reduce((sum: number, item: TransactionItem) => sum + (item.cost_snapshot * item.quantity), 0);
        acc.revenue += t.subtotal;
        acc.cogs += cogs;
        acc.orderCount += 1;
        acc.netProfit += (t.subtotal - cogs - t.discount);
        return acc;
      }, { revenue: 0, cogs: 0, orderCount: 0, netProfit: 0 });

      return {
        ...stats,
        branchId: b.id,
        branchName: b.name,
        grossProfit: stats.revenue - stats.cogs,
        totalDiscount: 0,
        totalTax: 0,
        bestSeller: 'Menu Favorit',
        trend: Math.random() > 0.5 ? 'up' : 'down'
      };
    });
  }
};
