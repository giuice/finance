export interface Expense {
  id?: number;
  date: Date;
  description: string;
  amount: number;
  category: string;
  isFixedExpense: boolean;
  installment?: {
    current: number;
    total: number;
  };
}

export interface Category {
  id?: number;
  name: string;
  budgetLimit?: number;
  color: string;
}

export interface BudgetPeriod {
  id?: number;
  periodType: 'daily' | 'weekly' | 'monthly' | 'custom';
  startDate: Date;
  endDate: Date;
  salary?: number;
  totalExpenses?: number;
  remainingBudget?: number;
  month?: number;
  year?: number;
  categories: {
    [key: number]: number;
  };
}

export interface NubankCSVRow {
  Date: string;
  Description: string;
  'Amount (BRL)': string;
}

export interface ParsedCSVRow {
  date: Date;
  description: string;
  amount: number;
  category?: string;
  isFixedExpense: boolean;
  installment?: {
    current: number;
    total: number;
  };
}
