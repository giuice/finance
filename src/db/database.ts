import Dexie, { Table } from 'dexie';
import { Expense, Category, BudgetPeriod } from '../types';

class FinanceDatabase extends Dexie {
  expenses!: Table<Expense, number>;
  categories!: Table<Category, number>;
  budgets!: Table<BudgetPeriod, number>;

  constructor() {
    super('FinanceDatabase');
    this.version(3).stores({
      expenses: '++id, date, category, isFixedExpense, [category+date]',
      categories: '++id, &name',
      budgets: '++id, periodType, startDate, endDate, [startDate+endDate]'
    }).upgrade(trans => {
      // Clear budgets when upgrading from v1->v2
      // We're now at v3 but keeping this for backward compatibility
      trans.table('budgets').clear();
      
      // For v2->v3 upgrade, we'll run the duplicate cleanup
      // when the app starts via initializeDatabase
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

  async searchExpensesByDescription(searchTerm: string): Promise<Expense[]> {
    if (!searchTerm.trim()) {
      return [];
    }
    
    return await this.expenses
      .filter(expense => 
        expense.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .toArray();
  }

  async getAllExpenses(): Promise<Expense[]> {
    return await this.expenses.toArray();
  }

  async updateMultipleExpenses(expenseIds: number[], changes: Partial<Expense>): Promise<number> {
    let updatedCount = 0;
    
    for (const id of expenseIds) {
      try {
        await this.expenses.update(id, changes);
        updatedCount++;
      } catch (error) {
        console.error(`Failed to update expense with ID ${id}:`, error);
      }
    }
    
    return updatedCount;
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
  async addBudgetPeriod(period: BudgetPeriod): Promise<number> {
    return await this.budgets.add(period);
  }

  async updateBudgetPeriod(id: number, changes: Partial<BudgetPeriod>): Promise<number> {
    return await this.budgets.update(id, changes);
  }

  async getBudgetPeriod(startDate: Date, endDate: Date): Promise<BudgetPeriod | undefined> {
    return await this.budgets
      .where('[startDate+endDate]')
      .equals([startDate, endDate])
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
      { name: 'Boteco', color: '#795548', budgetLimit: 0 },
      { name: 'Supermercado', color: '#FFC107', budgetLimit: 0 },
      { name: 'Other', color: '#607D8B', budgetLimit: 0 }
    ];

    const existingCategories = await this.getAllCategories();
    
    // Only add default categories if there are no categories at all
    if (existingCategories.length === 0) {
      for (const category of defaultCategories) {
        await this.addCategoryIfNotExists(category);
      }
    }
  }

  // Add a new utility to check for and clean up duplicate categories
  async cleanupDuplicateCategories(): Promise<number> {
    const allCategories = await this.getAllCategories();
    const uniqueNames = new Map<string, Category>();
    const duplicateIds: number[] = [];
    
    // Identify duplicates (keep the first occurrence of each name)
    for (const category of allCategories) {
      if (!uniqueNames.has(category.name)) {
        uniqueNames.set(category.name, category);
      } else if (category.id) {
        duplicateIds.push(category.id);
      }
    }
    
    // Delete all duplicates
    for (const id of duplicateIds) {
      await this.deleteCategory(id);
    }
    
    console.log(`Cleaned up ${duplicateIds.length} duplicate categories`);
    return duplicateIds.length;
  }

  // Add a helper method to check if a category name already exists
  async categoryNameExists(name: string): Promise<boolean> {
    const count = await this.categories
      .where('name')
      .equals(name)
      .count();
    
    return count > 0;
  }

  // Add a method to safely add a category if it doesn't already exist
  async addCategoryIfNotExists(category: Category): Promise<number> {
    const exists = await this.categoryNameExists(category.name);
    if (!exists) {
      return await this.addCategory(category);
    }
    // Return the ID of the existing category
    const existingCategory = await this.categories
      .where('name')
      .equals(category.name)
      .first();
      
    return existingCategory?.id || -1;
  }
}

export const db = new FinanceDatabase();

// Initialize the database
export const initializeDatabase = async (): Promise<void> => {
  // Clean up any duplicate categories first
  await db.cleanupDuplicateCategories();
  
  // Then initialize default categories if needed
  await db.initializeDefaultCategories();
};
