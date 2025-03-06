import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '../db/database';
import { Expense, Category } from '../types';

export default function ExpenseManager() {
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<Partial<Expense>>({
    date: new Date(),
    description: '',
    amount: 0,
    category: '',
    isFixedExpense: false
  });
  
  // Get expenses for the current month
  const { data: expenses, isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses', currentMonth, currentYear],
    queryFn: async () => {
      const expenses = await db.getExpensesByMonth(currentMonth, currentYear);
      return expenses || [];
    }
  });
  
  // Get all categories
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => db.getAllCategories()
  });
  
  // Add expense mutation
  const addExpenseMutation = useMutation({
    mutationFn: (expense: Expense) => db.addExpense(expense),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      resetForm();
    }
  });
  
  // Update expense mutation
  const updateExpenseMutation = useMutation({
    mutationFn: ({ id, expense }: { id: number; expense: Partial<Expense> }) => 
      db.updateExpense(id, expense),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      resetForm();
    }
  });
  
  // Delete expense mutation
  const deleteExpenseMutation = useMutation({
    mutationFn: (id: number) => db.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    }
  });
  
  // Reset form
  const resetForm = () => {
    setFormData({
      date: new Date(),
      description: '',
      amount: 0,
      category: '',
      isFixedExpense: false
    });
    setIsAddingExpense(false);
    setEditingExpense(null);
  };
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'date') {
      setFormData(prev => ({ ...prev, [name]: new Date(value) }));
    } else if (name === 'amount') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description || !formData.amount || !formData.category) {
      alert('Please fill in all required fields');
      return;
    }
    
    if (editingExpense && editingExpense.id) {
      updateExpenseMutation.mutate({
        id: editingExpense.id,
        expense: formData as Expense
      });
    } else {
      addExpenseMutation.mutate(formData as Expense);
    }
  };
  
  // Handle edit expense
  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      date: expense.date,
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      isFixedExpense: expense.isFixedExpense,
      installment: expense.installment
    });
    setIsAddingExpense(true);
  };
  
  // Handle delete expense
  const handleDeleteExpense = (id: number) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      deleteExpenseMutation.mutate(id);
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
  
  if (expensesLoading || categoriesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Expense Manager</h1>
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
      
      {/* Add Expense Button */}
      {!isAddingExpense && (
        <div className="mb-6">
          <button
            onClick={() => setIsAddingExpense(true)}
            className="btn-primary"
          >
            Add New Expense
          </button>
        </div>
      )}
      
      {/* Add/Edit Expense Form */}
      {isAddingExpense && (
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
            {editingExpense ? 'Edit Expense' : 'Add New Expense'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date ? formData.date.toISOString().split('T')[0] : ''}
                  onChange={handleInputChange}
                  className="input-field"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Amount (R$)
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount || ''}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="input-field"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  name="description"
                  value={formData.description || ''}
                  onChange={handleInputChange}
                  className="input-field"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category || ''}
                  onChange={handleInputChange}
                  className="input-field"
                  required
                >
                  <option value="">Select a category</option>
                  {categories?.map(category => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="md:col-span-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isFixedExpense"
                    id="isFixedExpense"
                    checked={formData.isFixedExpense || false}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isFixedExpense" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    This is a fixed monthly expense
                  </label>
                </div>
              </div>
              
              {/* Installment fields (only shown when editing an expense with installments) */}
              {formData.installment && (
                <div className="md:col-span-2 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Current Installment
                    </label>
                    <input
                      type="number"
                      name="installment.current"
                      value={formData.installment.current}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        installment: {
                          ...prev.installment!,
                          current: parseInt(e.target.value)
                        }
                      }))}
                      min="1"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Total Installments
                    </label>
                    <input
                      type="number"
                      name="installment.total"
                      value={formData.installment.total}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        installment: {
                          ...prev.installment!,
                          total: parseInt(e.target.value)
                        }
                      }))}
                      min="1"
                      className="input-field"
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={addExpenseMutation.isPending || updateExpenseMutation.isPending}
              >
                {addExpenseMutation.isPending || updateExpenseMutation.isPending ? 'Saving...' : 'Save Expense'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Expenses List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {expenses && expenses.length > 0 ? (
                expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {expense.date.toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {expense.description}
                      {expense.installment && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 rounded-full">
                          {expense.installment.current}/{expense.installment.total}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <span className="inline-flex items-center">
                        <span 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: categories?.find(cat => cat.name === expense.category)?.color || '#ccc' }}
                        ></span>
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {expense.isFixedExpense ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                          Fixed
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                          Variable
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditExpense(expense)}
                        className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => expense.id && handleDeleteExpense(expense.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No expenses found for this month
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
