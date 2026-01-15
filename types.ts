
export enum Role {
  OWNER = 'owner',
  KASIR = 'kasir'
}

export enum AccountStatus {
  TRIAL = 'trial',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  PENDING_PAYMENT = 'pending_payment'
}

export interface Subscription {
  id: string;
  userId: string;
  package: 'Trial' | 'Pro' | 'Bisnis';
  startDate: string;
  endDate: string;
  status: 'active' | 'expired';
}

export interface PaymentRecord {
  orderId: string;
  userId?: string;
  amount: number;
  paymentType: 'va' | 'qris';
  bank?: string;
  vaNumber?: string;
  qrisUrl?: string;
  status: 'pending' | 'paid' | 'failed';
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  branchId?: string;
  businessName?: string;
  packageType?: string;
  status?: AccountStatus;
  expiredAt?: string;
}

export interface Branch {
  id: string;
  name: string;
  location: string;
  ownerId: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  costPrice: number;
  stock: number;
  branchId: string;
  imageUrl: string;
}

export interface TransactionItem {
  productId: string;
  name: string;
  quantity: number;
  price_snapshot: number;
  cost_snapshot: number;
}

export type PaymentStatus = 'pending' | 'success' | 'failed' | 'expired';

export interface Transaction {
  id: string;
  branchId: string;
  cashierId: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: PaymentStatus;
  paymentMethod: 'CASH' | 'TRANSFER' | 'QRIS';
  paymentDetails?: {
    bank?: 'BCA' | 'BNI' | 'BRI' | 'MANDIRI' | 'CIMB' | 'PERMATA';
    va_number?: string;
    qris_url?: string;
    midtrans_order_id?: string;
  };
  date: string;
  items: TransactionItem[];
}

export interface FinancialStats {
  revenue: number;
  cogs: number;
  grossProfit: number;
  netProfit: number;
  totalDiscount: number;
  totalTax: number;
  orderCount: number;
}

export interface BranchPerformance extends FinancialStats {
  branchId: string;
  branchName: string;
  bestSeller: string;
  trend: 'up' | 'down' | 'stable';
}

export interface Category {
  id: string;
  name: string;
  branchId: string;
}
