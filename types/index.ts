export type TransactionType = 'debit' | 'credit';
export type TransactionSource = 'receipt' | 'mutasi' | 'manual';
export type TransactionCategory =
  | 'food'
  | 'shopping'
  | 'transport'
  | 'bills'
  | 'entertainment'
  | 'salary'
  | 'other';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  type: TransactionType;
  amount: number;
  category?: TransactionCategory;
  source: TransactionSource;
  merchant?: string;
  items?: ReceiptItem[];
  subtotal?: number;
  tax?: number;
  serviceCharge?: number;
  balance?: number;
  createdAt: string;
}

export interface ReceiptItem {
  name: string;
  price: number;
  quantity?: number;
}

export interface ReceiptData {
  merchant: string;
  date: string;
  items: ReceiptItem[];
  subtotal?: number;
  tax?: number;
  serviceCharge?: number;
  total: number;
}

export interface BankMutasiData {
  date: string;
  description: string;
  type: TransactionType;
  amount: number;
  balance: number;
}

export interface MonthlyStats {
  month: string;
  income: number;
  expense: number;
  balance: number;
}

export interface CategoryStats {
  category: TransactionCategory;
  amount: number;
  percentage: number;
  color: string;
}

export type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface PeriodStats {
  period: string; // e.g., "2024-01", "2024-W01", "2024-01-01", "2024"
  income: number;
  expense: number;
  balance: number;
  transactionCount: number;
}

export interface SavingsTarget {
  id: string;
  period: TimePeriod;
  periodKey: string; // e.g., "2024-01" for monthly
  targetAmount: number;
  currentAmount: number;
  createdAt: string;
  description?: string;
}
