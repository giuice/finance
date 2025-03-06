import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '../db/database';
import { Category, MonthlyBudget } from '../types';

export default function BudgetSettings() {
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  // Form state
  const [monthlySalary, setMonthlySalary] = useState<number>(0);
  const [categoryFormData, setCategoryFormData] = useState<Partial<Category>>({
    name: '',
    color: '#4CAF50',
    budgetLimit: 0
  });
  
  // Get all categories
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => db.getAllCategories()
  });
  
  // Get monthly budget
  const { data: budget, isLoading: budgetLoading } = useQuery({
    queryKey: ['budget', currentMonth, currentYear],
    queryFn: async () => {
      const budget = await db.getMonthlyBudget(currentMonth, currentYear);
      if (budget) {
        setMonthlySalary(budget.salary);
      }
      return budget || { salary: 0, totalExpenses: 0, remainingBudget: 0 };
    }
  });
  
  // Get expenses for the current month
  const { data: expenses, isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses', currentMonth, currentYear],
    queryFn: () => db.getExpensesByMonth(currentMonth, currentYear)
  });
  
  // Add/update monthly budget mutation
  const updateBudgetMutation = useMutation({
    mutationFn: async (salary: number) => {
      const existingBudget = await db.getMonthlyBudget(currentMonth, currentYear);
      
      if (existingBudget) {
        return db.updateMonthlyBudget(existingBudget.id!, {
          salary,
          totalExpenses: expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0,
          remainingBudget: salary - (expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0)
        });
      } else {
        return db.addMonthlyBudget({
          month: currentMonth,
          year: currentYear,
          salary,
          totalExpenses: expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0,
          remainingBudget: salary - (expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0)
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget'] });
    }
  });
  
  // Add category mutation
  const addCategoryMutation = useMutation({
    mutationFn: (category: Category) => db.addCategory(category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      resetCategoryForm();
    }
  });
  
  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, changes }: { id: number; changes: Partial<Category> }) => 
      db.updateCategory(id, changes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      resetCategoryForm();
    }
  });
  
  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => db.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    }
  });
  
  // Reset category form
  const resetCategoryForm = () => {
    setCategoryFormData({
      name: '',
      color: '#4CAF50',
      budgetLimit: 0
    });
    setIsEditingCategory(false);
    setEditingCategory(null);
  };
  
  // Handle salary form submission
  const handleSalarySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateBudgetMutation.mutate(monthlySalary);
  };
  
  // Handle category form input changes
  const handleCategoryInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setCategoryFormData(prev => ({ ...prev, [name]: parseFloat(value) }));
    } else {
      setCategoryFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  // Handle category form submission
  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!categoryFormData.name || !categoryFormData.color) {
      alert('Please fill in all required fields');
      return;
    }
    
    if (editingCategory && editingCategory.id) {
      updateCategoryMutation.mutate({
        id: editingCategory.id,
        changes: categoryFormData
      });
    } else {
      addCategoryMutation.mutate(categoryFormData as Category);
    }
  };
  
  // Handle edit category
  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      color: category.color,
      budgetLimit: category.budgetLimit
    });
    setIsEditingCategory(true);
  };
  
  // Handle delete category
  const handleDeleteCategory = (id: number) => {
    if (confirm('Are you sure you want to delete this category?')) {
      deleteCategoryMutation.mutate(id);
    }
  };
  
  // Handle month navigation
  const handlePreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };
  
  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  if (categoriesLoading || budgetLoading || expensesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Calculate expenses by category
  const expensesByCategory = expenses?.reduce((acc: Record<string, number>, expense) => {
    const category = expense.category || 'Uncategorized';
    acc[category] = (acc[category] || 0) + expense.amount;
    return acc;
  }, {}) || {};
  
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Budget Settings</h1>
      
      {/* Monthly Budget Section */}
      <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Monthly Budget</h2>
          <div className="flex items-center space-x-4">
            <button 
              onClick={handlePreviousMonth}
              className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-lg font-medium text-gray-700 dark:text-gray-300">
              {monthNames[currentMonth]} {currentYear}
            </span>
            <button 
              onClick={handleNextMonth}
              className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSalarySubmit} className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Monthly Salary (R$)
              </label>
              <input
                type="number"
                value={monthlySalary || ''}
                onChange={(e) => setMonthlySalary(parseFloat(e.target.value))}
                step="0.01"
                min="0"
                className="input-field"
                required
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="btn-primary"
                disabled={updateBudgetMutation.isPending}
              >
                {updateBudgetMutation.isPending ? 'Saving...' : 'Save Budget'}
              </button>
            </div>
          </div>
        </form>
        
        {/* Budget Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Monthly Income</h3>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{formatCurrency(monthlySalary)}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Expenses</h3>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">
              {formatCurrency(expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0)}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Remaining</h3>
            <p className={`text-2xl font-bold ${
              monthlySalary - (expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0) < 0
                ? 'text-red-600 dark:text-red-400'
                : 'text-green-600 dark:text-green-400'
            }`}>
              {formatCurrency(monthlySalary - (expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0))}
            </p>
          </div>
        </div>
      </div>
      
      {/* Categories Section */}
      <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Categories</h2>
          {!isEditingCategory && (
            <button
              onClick={() => setIsEditingCategory(true)}
              className="btn-primary"
            >
              Add Category
            </button>
          )}
        </div>
        
        {/* Add/Edit Category Form */}
        {isEditingCategory && (
          <div className="mb-6 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h3>
            <form onSubmit={handleCategorySubmit}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={categoryFormData.name || ''}
                    onChange={handleCategoryInputChange}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Color
                  </label>
                  <div className="flex items-center">
                    <input
                      type="color"
                      name="color"
                      value={categoryFormData.color || '#4CAF50'}
                      onChange={handleCategoryInputChange}
                      className="h-10 w-10 rounded border border-gray-300 dark:border-gray-600 mr-2"
                    />
                    <input
                      type="text"
                      name="color"
                      value={categoryFormData.color || ''}
                      onChange={handleCategoryInputChange}
                      className="input-field"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Budget Limit (R$)
                  </label>
                  <input
                    type="number"
                    name="budgetLimit"
                    value={categoryFormData.budgetLimit || ''}
                    onChange={handleCategoryInputChange}
                    step="0.01"
                    min="0"
                    className="input-field"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetCategoryForm}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={addCategoryMutation.isPending || updateCategoryMutation.isPending}
                >
                  {addCategoryMutation.isPending || updateCategoryMutation.isPending ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Categories List */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Budget Limit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Current Spending</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {categories && categories.length > 0 ? (
                categories.map((category) => {
                  const currentSpending = expensesByCategory[category.name] || 0;
                  const budgetLimit = category.budgetLimit || 0;
                  const isOverBudget = budgetLimit > 0 && currentSpending > budgetLimit;
                  
                  return (
                    <tr key={category.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <span 
                            className="w-4 h-4 rounded-full mr-2" 
                            style={{ backgroundColor: category.color }}
                          ></span>
                          {category.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {category.budgetLimit ? formatCurrency(category.budgetLimit) : 'Not set'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatCurrency(currentSpending)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {budgetLimit > 0 ? (
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mr-2">
                              <div 
                                className={`h-2.5 rounded-full ${isOverBudget ? 'bg-red-500' : 'bg-green-500'}`}
                                style={{ width: `${Math.min(100, (currentSpending / budgetLimit) * 100)}%` }}
                              ></div>
                            </div>
                            <span className={isOverBudget ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400'}>
                              {Math.round((currentSpending / budgetLimit) * 100)}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">No limit set</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditCategory(category)}
                          className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => category.id && handleDeleteCategory(category.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No categories found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
