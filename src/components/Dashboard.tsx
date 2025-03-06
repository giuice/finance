import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { db } from '../db/database';
import { Expense, Category, MonthlyBudget } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

export default function Dashboard() {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  // Get expenses for the current month
  const { data: expenses, isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses', currentMonth, currentYear],
    queryFn: () => db.getExpensesByMonth(currentMonth, currentYear)
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
      return budget || { salary: 0, totalExpenses: 0, remainingBudget: 0 };
    }
  });
  
  // Calculate total expenses
  const totalExpenses = expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0;
  
  // Calculate expenses by category
  const expensesByCategory = expenses?.reduce((acc: Record<string, number>, expense) => {
    const category = expense.category || 'Uncategorized';
    acc[category] = (acc[category] || 0) + expense.amount;
    return acc;
  }, {}) || {};
  
  // Prepare data for pie chart
  const pieChartData = Object.entries(expensesByCategory).map(([name, value]) => ({
    name,
    value,
    color: categories?.find(cat => cat.name === name)?.color || '#ccc'
  }));
  
  // Prepare data for bar chart (last 6 months)
  const [barChartData, setBarChartData] = useState<{ month: string; expenses: number }[]>([]);
  
  useEffect(() => {
    const fetchLastSixMonthsData = async () => {
      const data = [];
      const currentDate = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate);
        date.setMonth(currentDate.getMonth() - i);
        
        const month = date.getMonth();
        const year = date.getFullYear();
        
        const monthExpenses = await db.getExpensesByMonth(month, year);
        const totalAmount = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        data.push({
          month: `${monthNames[month]} ${year}`,
          expenses: totalAmount
        });
      }
      
      setBarChartData(data);
    };
    
    fetchLastSixMonthsData();
  }, [currentMonth, currentYear]);
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
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
  
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  if (expensesLoading || categoriesLoading || budgetLoading) {
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
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
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
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Total Expenses</h2>
          <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">{formatCurrency(totalExpenses)}</p>
        </div>
        
        <div className="card bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Monthly Budget</h2>
          <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
            {budget ? formatCurrency(budget.salary) : 'Not set'}
          </p>
        </div>
        
        <div className="card bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Remaining</h2>
          <p className={`text-3xl font-bold ${
            budget && (budget.salary - totalExpenses) < 0 
              ? 'text-red-600 dark:text-red-400' 
              : 'text-green-600 dark:text-green-400'
          }`}>
            {budget ? formatCurrency(budget.salary - totalExpenses) : 'N/A'}
          </p>
        </div>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Expenses by Category */}
        <div className="card bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">Expenses by Category</h2>
          {pieChartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
              No data available for this month
            </div>
          )}
        </div>
        
        {/* Monthly Trend */}
        <div className="card bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">Monthly Trend</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Legend />
                <Bar dataKey="expenses" fill="#0ea5e9" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Recent Expenses */}
      <div className="card bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">Recent Expenses</h2>
        {expenses && expenses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {expenses.slice(0, 5).map((expense) => (
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
            No expenses found for this month
          </div>
        )}
      </div>
    </div>
  );
}
