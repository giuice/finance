import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '../db/database';
import { Expense, Category } from '../types';
import debounce from 'lodash.debounce';

export default function CategoryManager() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExpenses, setSelectedExpenses] = useState<Expense[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [similarExpenses, setSimilarExpenses] = useState<{ [key: string]: Expense[] }>({});
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Get all categories
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => db.getAllCategories()
  });

  // Search expenses by description
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['expenses', 'search', searchTerm],
    queryFn: async () => {
      if (!searchTerm.trim()) return [];
      return await db.searchExpensesByDescription(searchTerm);
    },
    enabled: searchTerm.trim().length > 0
  });

  // Update multiple expenses mutation
  const updateExpensesMutation = useMutation({
    mutationFn: ({ ids, changes }: { ids: number[]; changes: Partial<Expense> }) => 
      db.updateMultipleExpenses(ids, changes),
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setNotification({ 
        type: 'success', 
        message: `Successfully updated ${count} expense${count !== 1 ? 's' : ''}` 
      });
      setSelectedExpenses([]);
    },
    onError: (error) => {
      setNotification({ 
        type: 'error', 
        message: `Failed to update expenses: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  });

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((term: string) => {
      setSearchTerm(term);
    }, 300),
    []
  );

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  // Handle expense selection
  const handleExpenseSelection = (expense: Expense, isSelected: boolean) => {
    if (isSelected) {
      setSelectedExpenses(prev => [...prev, expense]);
    } else {
      setSelectedExpenses(prev => prev.filter(e => e.id !== expense.id));
    }
  };

  // Find similar expenses
  useEffect(() => {
    if (!searchResults || searchResults.length === 0) {
      setSimilarExpenses({});
      return;
    }

    const similarMap: { [key: string]: Expense[] } = {};
    
    searchResults.forEach(expense => {
      const key = expense.description.toLowerCase();
      if (!similarMap[key]) {
        similarMap[key] = [];
      }
      similarMap[key].push(expense);
    });

    // Only keep entries with more than one expense
    const filteredMap: { [key: string]: Expense[] } = {};
    Object.entries(similarMap).forEach(([key, expenses]) => {
      if (expenses.length > 1) {
        filteredMap[key] = expenses;
      }
    });

    setSimilarExpenses(filteredMap);
  }, [searchResults]);

  // Handle select all similar
  const handleSelectAllSimilar = (description: string) => {
    const expensesToAdd = searchResults?.filter(
      e => e.description.toLowerCase() === description.toLowerCase()
    ) || [];
    
    // Add only expenses that aren't already selected
    const currentIds = new Set(selectedExpenses.map(e => e.id));
    const newExpenses = expensesToAdd.filter(e => e.id && !currentIds.has(e.id));
    
    setSelectedExpenses(prev => [...prev, ...newExpenses]);
    
    setNotification({ 
      type: 'info', 
      message: `Selected ${newExpenses.length} additional expense${newExpenses.length !== 1 ? 's' : ''}` 
    });
  };

  // Handle category assignment
  const handleAssignCategory = () => {
    if (!selectedCategory || selectedExpenses.length === 0) {
      setNotification({ 
        type: 'error', 
        message: 'Please select both expenses and a category' 
      });
      return;
    }

    const expenseIds = selectedExpenses
      .map(e => e.id)
      .filter((id): id is number => id !== undefined);

    updateExpensesMutation.mutate({
      ids: expenseIds,
      changes: { category: selectedCategory }
    });
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Clear notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  if (categoriesLoading) {
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
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Category Manager</h1>
      
      {/* Notification */}
      {notification && (
        <div 
          className={`mb-6 p-4 rounded-md ${
            notification.type === 'success' 
              ? 'bg-green-100 border-l-4 border-green-500 text-green-700 dark:bg-green-900 dark:text-green-300' 
              : notification.type === 'error'
                ? 'bg-red-100 border-l-4 border-red-500 text-red-700 dark:bg-red-900 dark:text-red-300'
                : 'bg-blue-100 border-l-4 border-blue-500 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
          }`} 
          role="alert"
        >
          <p>{notification.message}</p>
        </div>
      )}
      
      {/* Search and Category Selection */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Search Expenses
          </label>
          <input
            type="text"
            placeholder="Type to search expenses by description..."
            onChange={handleSearchChange}
            className="input-field"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Select Category
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input-field"
          >
            <option value="">Select a category</option>
            {categories?.map(category => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Selected Expenses Summary */}
      {selectedExpenses.length > 0 && (
        <div className="mb-6 bg-gray-100 dark:bg-gray-700 p-4 rounded-md">
          <div className="flex justify-between items-center">
            <p className="text-gray-700 dark:text-gray-300">
              <span className="font-semibold">{selectedExpenses.length}</span> expense{selectedExpenses.length !== 1 ? 's' : ''} selected
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setSelectedExpenses([])}
                className="btn-secondary text-sm py-1 px-3"
              >
                Clear Selection
              </button>
              <button
                onClick={handleAssignCategory}
                disabled={!selectedCategory || updateExpensesMutation.isPending}
                className="btn-primary text-sm py-1 px-3"
              >
                {updateExpensesMutation.isPending ? 'Updating...' : 'Assign Category'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Search Results */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-8">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Search Results
            {searchLoading && (
              <span className="ml-2 inline-block w-4 h-4 border-2 border-t-transparent border-primary-500 rounded-full animate-spin"></span>
            )}
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          {searchResults && searchResults.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-10">
                    <span className="sr-only">Select</span>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Current Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {searchResults.map((expense) => {
                  const isSelected = selectedExpenses.some(e => e.id === expense.id);
                  const hasSimilar = similarExpenses[expense.description.toLowerCase()]?.length > 1;
                  
                  return (
                    <tr 
                      key={expense.id} 
                      className={isSelected ? 'bg-primary-50 dark:bg-primary-900/20' : ''}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleExpenseSelection(expense, e.target.checked)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {expense.date.toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <span>{expense.description}</span>
                          {hasSimilar && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                              Similar
                            </span>
                          )}
                          {expense.installment && (
                            <span className="ml-2 text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 px-2 py-0.5 rounded-full">
                              {expense.installment.current}/{expense.installment.total}
                            </span>
                          )}
                        </div>
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
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {hasSimilar && (
                          <button
                            onClick={() => handleSelectAllSimilar(expense.description)}
                            className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                          >
                            Select All Similar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              {searchTerm.trim() 
                ? 'No expenses found matching your search' 
                : 'Type in the search box to find expenses'}
            </div>
          )}
        </div>
      </div>
      
      {/* Similar Expenses Groups */}
      {Object.keys(similarExpenses).length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
              Similar Expense Groups
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              These groups contain expenses with identical descriptions that can be categorized together
            </p>
          </div>
          
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(similarExpenses).map(([description, expenses]) => (
              <div 
                key={description}
                className="border border-gray-200 dark:border-gray-700 rounded-md p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-700 dark:text-gray-300">{expenses[0].description}</h3>
                  <button
                    onClick={() => handleSelectAllSimilar(description)}
                    className="text-sm text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                  >
                    Select All ({expenses.length})
                  </button>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  <p>Total: {formatCurrency(expenses.reduce((sum, e) => sum + e.amount, 0))}</p>
                  <p>Categories: {Array.from(new Set(expenses.map(e => e.category))).join(', ')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
