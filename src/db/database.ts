import Dexie, { Table } from 'dexie';
import { Expense, Category, MonthlyBudget } from '../types';

class FinanceDatabase extends Dexie {
  expenses!: Table<Expense, number>;
  categories!: Table<Category, number>;
  monthlyBudgets!: Table<MonthlyBudget, number>;

  constructor() {
    super('FinanceDatabase');
    this.version(1).stores({
      expenses: '++id, date, category, isFixedExpense',
      categories: '++id, name',
      monthlyBudgets: '++id, [month+year]'
    });
  }

  // Helper methods for expenses
  async addExpense(expense: Expense): Promise<number> {
    return await this.expenses.add(expense);
  }

  async updateExpense(id: number, changes: Partial<Expense>): Promise<number> {
    return await this.expenses.update(id, changes);
  }

  async deleteExpense(id: number): Promise<void> {
    return await this.expenses.delete(id);
  }

  async getExpensesByMonth(month: number, year: number): Promise<Expense[]> {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    
    return await this.expenses
      .where('date')
      .between(startDate, endDate, true, true)
      .toArray();
  }

  async getFixedExpenses(): Promise<Expense[]> {
    return await this.expenses
      .where('isFixedExpense')
      .equals(1)
      .toArray();
  }

  // Helper methods for categories
  async addCategory(category: Category): Promise<number> {
    return await this.categories.add(category);
  }

  async updateCategory(id: number, changes: Partial<Category>): Promise<number> {
    return await this.categories.update(id, changes);
  }

  async deleteCategory(id: number): Promise<void> {
    return await this.categories.delete(id);
  }

  async getAllCategories(): Promise<Category[]> {
    return await this.categories.toArray();
  }

  // Helper methods for monthly budgets
  async addMonthlyBudget(budget: MonthlyBudget): Promise<number> {
    return await this.monthlyBudgets.add(budget);
  }

  async updateMonthlyBudget(id: number, changes: Partial<MonthlyBudget>): Promise<number> {
    return await this.monthlyBudgets.update(id, changes);
  }

  async getMonthlyBudget(month: number, year: number): Promise<MonthlyBudget | undefined> {
    return await this.monthlyBudgets
      .where('[month+year]')
      .equals([month, year])
      .first();
  }

  // Initialize with default categories
  async initializeDefaultCategories(): Promise<void> {
    const defaultCategories: Category[] = [
      { name: 'Food', color: '#4CAF50', budgetLimit: 0 },
      { name: 'Transportation', color: '#2196F3', budgetLimit: 0 },
      { name: 'Housing', color: '#9C27B0', budgetLimit: 0 },
      { name: 'Entertainment', color: '#FF9800', budgetLimit: 0 },
      { name: 'Shopping', color: '#E91E63', budgetLimit: 0 },
      { name: 'Health', color: '#00BCD4', budgetLimit: 0 },
      { name: 'Education', color: '#3F51B5', budgetLimit: 0 },
      { name: 'Bills', color: '#F44336', budgetLimit: 0 },
      { name: 'Other', color: '#607D8B', budgetLimit: 0 }
    ];

    const existingCategories = await this.getAllCategories();
    
    if (existingCategories.length === 0) {
      for (const category of defaultCategories) {
        await this.addCategory(category);
      }
    }
  }
}

export const db = new FinanceDatabase();

// Initialize the database
export const initializeDatabase = async (): Promise<void> => {
  await db.initializeDefaultCategories();
};
