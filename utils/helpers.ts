import { Transaction, MonthlyStats, CategoryStats, TransactionCategory, PeriodStats, TimePeriod } from '../types';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const calculateBalance = (transactions: Transaction[]): number => {
  // First, try to get the balance from the most recent bank statement transaction
  const transactionsWithBalance = transactions
    .filter((t) => t.balance !== undefined && t.balance !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (transactionsWithBalance.length > 0) {
    // Use the most recent bank statement balance as the source of truth
    return transactionsWithBalance[0].balance!;
  }

  // Fallback: calculate from transactions if no bank balance available
  return transactions.reduce((acc, t) => {
    return t.type === 'credit' ? acc + t.amount : acc - t.amount;
  }, 0);
};

export const getMonthlyStats = (transactions: Transaction[]): MonthlyStats[] => {
  const monthlyData: { [key: string]: MonthlyStats } = {};

  transactions.forEach((t) => {
    const date = new Date(t.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        month: monthKey,
        income: 0,
        expense: 0,
        balance: 0,
      };
    }

    if (t.type === 'credit') {
      monthlyData[monthKey].income += t.amount;
    } else {
      monthlyData[monthKey].expense += t.amount;
    }
  });

  Object.values(monthlyData).forEach((month) => {
    month.balance = month.income - month.expense;
  });

  return Object.values(monthlyData).sort((a, b) => b.month.localeCompare(a.month));
};

const categoryColors: { [key in TransactionCategory]: string } = {
  food: '#FF6B6B',
  shopping: '#4ECDC4',
  transport: '#45B7D1',
  bills: '#FFA07A',
  entertainment: '#DDA15E',
  salary: '#06D6A0',
  other: '#9B59B6',
};

export const getCategoryStats = (transactions: Transaction[]): CategoryStats[] => {
  const categoryData: { [key in TransactionCategory]?: number } = {};
  let totalExpense = 0;

  transactions
    .filter((t) => t.type === 'debit')
    .forEach((t) => {
      const category = t.category || 'other';
      categoryData[category] = (categoryData[category] || 0) + t.amount;
      totalExpense += t.amount;
    });

  return Object.entries(categoryData).map(([category, amount]) => ({
    category: category as TransactionCategory,
    amount,
    percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
    color: categoryColors[category as TransactionCategory],
  }));
};

export const filterTransactionsByMonth = (
  transactions: Transaction[],
  year: number,
  month: number
): Transaction[] => {
  return transactions.filter((t) => {
    const date = new Date(t.date);
    return date.getFullYear() === year && date.getMonth() === month;
  });
};

export const getTotalIncome = (transactions: Transaction[]): number => {
  return transactions
    .filter((t) => t.type === 'credit')
    .reduce((acc, t) => acc + t.amount, 0);
};

export const getTotalExpense = (transactions: Transaction[]): number => {
  return transactions
    .filter((t) => t.type === 'debit')
    .reduce((acc, t) => acc + t.amount, 0);
};

// Time period helpers
export const getWeekKey = (date: Date): string => {
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const pastDaysOfYear = (date.getTime() - startOfYear.getTime()) / 86400000;
  const weekNumber = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
  return `${year}-W${String(weekNumber).padStart(2, '0')}`;
};

export const getDayKey = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export const getMonthKey = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

export const getYearKey = (date: Date): string => {
  return `${date.getFullYear()}`;
};

export const getPeriodKey = (date: Date, period: TimePeriod): string => {
  switch (period) {
    case 'daily':
      return getDayKey(date);
    case 'weekly':
      return getWeekKey(date);
    case 'monthly':
      return getMonthKey(date);
    case 'yearly':
      return getYearKey(date);
  }
};

export const formatPeriodKey = (periodKey: string, period: TimePeriod): string => {
  switch (period) {
    case 'daily':
      return new Date(periodKey).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    case 'weekly':
      const [year, week] = periodKey.split('-W');
      return `Week ${week}, ${year}`;
    case 'monthly':
      const [y, m] = periodKey.split('-');
      return new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString('id-ID', {
        month: 'long',
        year: 'numeric',
      });
    case 'yearly':
      return periodKey;
  }
};

export const getPeriodStats = (
  transactions: Transaction[],
  period: TimePeriod
): PeriodStats[] => {
  const periodData: { [key: string]: PeriodStats } = {};

  transactions.forEach((t) => {
    const date = new Date(t.date);
    const periodKey = getPeriodKey(date, period);

    if (!periodData[periodKey]) {
      periodData[periodKey] = {
        period: periodKey,
        income: 0,
        expense: 0,
        balance: 0,
        transactionCount: 0,
      };
    }

    if (t.type === 'credit') {
      periodData[periodKey].income += t.amount;
    } else {
      periodData[periodKey].expense += t.amount;
    }
    periodData[periodKey].transactionCount++;
  });

  Object.values(periodData).forEach((data) => {
    data.balance = data.income - data.expense;
  });

  return Object.values(periodData).sort((a, b) => b.period.localeCompare(a.period));
};

export const filterTransactionsByPeriod = (
  transactions: Transaction[],
  period: TimePeriod,
  periodKey: string
): Transaction[] => {
  return transactions.filter((t) => {
    const date = new Date(t.date);
    return getPeriodKey(date, period) === periodKey;
  });
};

export const getCategoryStatsForPeriod = (
  transactions: Transaction[],
  period: TimePeriod,
  periodKey: string
): CategoryStats[] => {
  const filteredTransactions = filterTransactionsByPeriod(transactions, period, periodKey);
  return getCategoryStats(filteredTransactions);
};
