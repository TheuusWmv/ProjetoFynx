export type Trend = 'up' | 'down';

export interface OverviewItem {
  title: string;
  value: string;
  change: string;
  trend: Trend;
}

export type TransactionStatus = 'completed' | 'pending' | 'failed';
export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: number;
  description: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  date: string; // YYYY-MM-DD
  category: string;
}

export interface DashboardData {
  overview: OverviewItem[];
  recentTransactions: Transaction[];
  spendingByCategory: { category: string; value: number }[];
  incomeByCategory: { category: string; value: number }[];
  dailyPerformance: { day: string; date: string; income: number; expense: number }[];
  monthlyPerformance: { month: string; income: number; expense: number }[];
}