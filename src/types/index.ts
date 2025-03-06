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

export interface MonthlyBudget {
  id?: number;
  month: number;
  year: number;
  salary: number;
  totalExpenses: number;
  remainingBudget: number;
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
