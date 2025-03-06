import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { db } from '../db/database';
import { Expense, Category, MonthlyBudget } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, CartesianGrid } from 'recharts';

// Add interfaces for component props
interface MonthNavigatorProps {
  currentMonth: number;
  currentYear: number;
  monthNames: string[];
  onPrevious: () => void;
  onNext: () => void;
}

interface SummaryCardsProps {
  totalExpenses: number;
  budget: MonthlyBudget | null;
  formatCurrency: (value: number) => string;
  expenseChange: number;
  dailyBudget: number;
}

interface BudgetProgressProps {
  totalExpenses: number;
  budget: MonthlyBudget | null;
  formatCurrency: (value: number) => string;
  daysLeft: number;
}

interface ChartDataItem {
  name: string;
  value: number;
  color: string;
  percentage: number;
}

interface TopSpendingCategoriesProps {
  pieChartData: ChartDataItem[];
  formatCurrency: (value: number) => string;
  totalExpenses: number;
}

interface FinancialInsightsProps {
  budget: MonthlyBudget | null;
  totalExpenses: number;
  expenseChange: number;
  pieChartData: ChartDataItem[];
}

interface ExpensesPieChartProps {
  pieChartData: ChartDataItem[];
  formatCurrency: (value: number) => string;
}

interface MonthlyTrendChartProps {
  barChartData: {
    month: string;
    expenses: number;
    budget: number;
  }[];
  formatCurrency: (value: number) => string;
}

interface RecentExpensesProps {
  expenses: Expense[] | undefined;
  categories: Category[] | undefined;
  formatCurrency: (value: number) => string;
}

export default function Dashboard() {
  // ===== HOOKS SECTION =====
  // State hooks
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [barChartData, setBarChartData] = useState<{ month: string; expenses: number; budget: number }[]>([]);
  
  // Query hooks
  const { data: expenses, isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses', currentMonth, currentYear],
    queryFn: () => db.getExpensesByMonth(currentMonth, currentYear)
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => db.getAllCategories()
  });

  const { data: budget, isLoading: budgetLoading } = useQuery({
    queryKey: ['budget', currentMonth, currentYear],
    queryFn: async () => {
      const budget = await db.getMonthlyBudget(currentMonth, currentYear);
      return budget || { 
        salary: 0, 
        totalExpenses: 0, 
        remainingBudget: 0, 
        month: currentMonth, 
        year: currentYear 
      };
    }
  });

  // Previous month data for comparison
  const { data: previousMonthExpenses } = useQuery({
    queryKey: ['prevExpenses', currentMonth, currentYear],
    queryFn: () => {
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      return db.getExpensesByMonth(prevMonth, prevYear);
    }
  });

  // ===== DERIVED DATA SECTION =====
  // Calculate total expenses
  const totalExpenses = useMemo(() => 
    expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0
  , [expenses]);
  
  // Calculate previous month's total for comparison
  const prevMonthTotal = useMemo(() => 
    previousMonthExpenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0
  , [previousMonthExpenses]);
  
  // Calculate month-over-month change
  const expenseChange = useMemo(() => {
    if (prevMonthTotal === 0) return 100; // If no previous expenses, consider it 100% increase
    return ((totalExpenses - prevMonthTotal) / prevMonthTotal) * 100;
  }, [totalExpenses, prevMonthTotal]);

  // Calculate daily budget
  const dailyBudget = useMemo(() => {
    if (!budget?.salary) return 0;
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    return (budget.salary - totalExpenses) / daysInMonth;
  }, [budget, totalExpenses, currentMonth, currentYear]);

  // Calculate expenses by category
  const expensesByCategory = useMemo(() => {
    return expenses?.reduce((acc: Record<string, number>, expense) => {
      const category = expense.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + expense.amount;
      return acc;
    }, {}) || {};
  }, [expenses]);

  // Prepare data for pie chart
  const pieChartData = useMemo(() => {
    return Object.entries(expensesByCategory).map(([name, value]) => ({
      name,
      value,
      color: categories?.find(cat => cat.name === name)?.color || '#ccc',
      percentage: totalExpenses > 0 ? (value / totalExpenses) * 100 : 0
    }));
  }, [expensesByCategory, categories, totalExpenses]);

  // ===== EFFECT HOOKS =====
  // Fetch historical data for charts
  useEffect(() => {
    const fetchLastSixMonthsData = async () => {
      const data = [];
      const currentDate = new Date(currentYear, currentMonth);

      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate);
        date.setMonth(date.getMonth() - i);

        const month = date.getMonth();
        const year = date.getFullYear();

        const monthExpenses = await db.getExpensesByMonth(month, year);
        const monthBudget = await db.getMonthlyBudget(month, year);
        const totalAmount = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        data.push({
          month: `${monthNames[month]} ${year}`,
          expenses: totalAmount,
          budget: monthBudget?.salary || 0
        });
      }

      setBarChartData(data);
    };

    fetchLastSixMonthsData();
  }, [currentMonth, currentYear]);

  // ===== UTILITY FUNCTIONS =====
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

  // ===== LOADING STATE =====
  if (expensesLoading || categoriesLoading || budgetLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // ===== COMPONENT UI SECTION =====
  return (
    <div>
      <MonthNavigator 
        currentMonth={currentMonth}
        currentYear={currentYear}
        monthNames={monthNames}
        onPrevious={handlePreviousMonth}
        onNext={handleNextMonth}
      />
      
      <SummaryCards 
        totalExpenses={totalExpenses} 
        budget={budget || null}
        formatCurrency={formatCurrency}
        expenseChange={expenseChange}
        dailyBudget={dailyBudget}
      />

      <BudgetProgress 
        totalExpenses={totalExpenses}
        budget={budget || null}
        formatCurrency={formatCurrency}
        daysLeft={new Date(currentYear, currentMonth + 1, 0).getDate() - new Date().getDate() + 1}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-1">
          <TopSpendingCategories 
            pieChartData={pieChartData} 
            formatCurrency={formatCurrency} 
            totalExpenses={totalExpenses}
          />
        </div>
        
        <div className="lg:col-span-2">
          <FinancialInsights 
            budget={budget || null}
            totalExpenses={totalExpenses}
            expenseChange={expenseChange}
            pieChartData={pieChartData}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ExpensesPieChart 
          pieChartData={pieChartData}
          formatCurrency={formatCurrency}
        />
        
        <MonthlyTrendChart 
          barChartData={barChartData}
          formatCurrency={formatCurrency}
        />
      </div>

      <RecentExpenses 
        expenses={expenses}
        categories={categories}
        formatCurrency={formatCurrency}
      />
    </div>
  );
}

// ===== SUBCOMPONENTS =====

function MonthNavigator({ currentMonth, currentYear, monthNames, onPrevious, onNext }: MonthNavigatorProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Financial Dashboard</h1>
      <div className="flex items-center space-x-4">
        <button
          onClick={onPrevious}
          className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
          aria-label="Previous month"
        >
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-lg font-medium text-gray-700 dark:text-gray-300">
          {monthNames[currentMonth]} {currentYear}
        </span>
        <button
          onClick={onNext}
          className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
          aria-label="Next month"
        >
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function SummaryCards({ totalExpenses, budget, formatCurrency, expenseChange, dailyBudget }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="card bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-l-4 border-blue-500">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Total Expenses</h2>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{formatCurrency(totalExpenses)}</p>
          </div>
          <div className={`text-sm font-medium px-2 py-1 rounded ${
            expenseChange > 0 ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' : 
            'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
          }`}>
            {expenseChange > 0 ? '↑' : '↓'} {Math.abs(expenseChange).toFixed(1)}% from last month
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Based on {budget?.remainingBudget || 0} ramaining budget this month
        </div>
      </div>

      <div className="card bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-l-4 border-indigo-500">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Monthly Budget</h2>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">
              {budget ? formatCurrency(budget.salary) : 'Not set'}
            </p>
          </div>
          <button className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
            Edit Budget
          </button>
        </div>
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          {budget && budget.salary > 0 
            ? `${((totalExpenses / budget.salary) * 100).toFixed(1)}% of budget used`
            : 'Set a budget to track your spending'}
        </div>
      </div>

      <div className="card bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-l-4 border-green-500">
        <div>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Daily Budget</h2>
          <p className={`text-2xl font-bold ${
            dailyBudget < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
            {formatCurrency(dailyBudget)}
          </p>
        </div>
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          {dailyBudget > 0 
            ? `Available to spend each day for the rest of the month`
            : `You are over budget for this month`}
        </div>
      </div>
    </div>
  );
}

function BudgetProgress({ totalExpenses, budget, formatCurrency, daysLeft }: BudgetProgressProps) {
  const percentUsed = budget && budget.salary > 0 ? (totalExpenses / budget.salary) * 100 : 0;
  
  return (
    <div className="card bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Budget Utilization</h2>
        <span className="text-sm bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 px-2 py-1 rounded">
          {daysLeft} days left
        </span>
      </div>
      
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-2">
        <div 
          className={`h-full rounded-full ${
            percentUsed > 90 ? 'bg-red-500' : 
            percentUsed > 70 ? 'bg-yellow-500' : 'bg-green-500'
          }`}
          style={{ width: `${Math.min(100, percentUsed)}%` }}
        ></div>
      </div>
      
      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>{formatCurrency(totalExpenses)} used</span>
        <span>{percentUsed.toFixed(1)}%</span>
        <span>{budget && formatCurrency(budget.salary)} total</span>
      </div>
      
      <div className="mt-3 text-sm">
        <span className={`font-medium ${
          percentUsed > 90 ? 'text-red-600 dark:text-red-400' : 
          percentUsed > 70 ? 'text-yellow-600 dark:text-yellow-400' : 
          'text-green-600 dark:text-green-400'
        }`}>
          {percentUsed > 90 ? 'Warning: ' : percentUsed > 70 ? 'Notice: ' : 'Good: '}
        </span>
        <span className="text-gray-600 dark:text-gray-400">
          {percentUsed > 90 ? 'You\'re almost out of budget! Consider reducing expenses.' : 
           percentUsed > 70 ? 'You\'ve used most of your budget. Monitor your spending carefully.' : 
           'Your spending is on track with your budget.'}
        </span>
      </div>
    </div>
  );
}

function TopSpendingCategories({ pieChartData, formatCurrency, totalExpenses }: TopSpendingCategoriesProps) {
  return (
    <div className="card bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 h-full">
      <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">Top Spending Categories</h2>
      {pieChartData.length > 0 ? (
        <div className="space-y-4">
          {pieChartData
            .sort((a, b) => b.value - a.value)
            .slice(0, 5)
            .map((category, index) => (
              <div key={index} className="flex items-center justify-between group hover:bg-gray-50 dark:hover:bg-gray-750 p-2 rounded cursor-pointer">
                <div className="flex items-center">
                  <div
                    className="w-4 h-4 rounded-full mr-3"
                    style={{ backgroundColor: category.color }}
                  ></div>
                  <span className="text-gray-700 dark:text-gray-300">{category.name}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-900 dark:text-white mr-2">
                    {formatCurrency(category.value)}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    ({category.percentage.toFixed(1)}%)
                  </span>
                  <span className="opacity-0 group-hover:opacity-100 ml-2 text-blue-500 hover:text-blue-700">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="text-gray-500 dark:text-gray-400 py-8 text-center">No data available</div>
      )}
    </div>
  );
}

function FinancialInsights({ budget, totalExpenses, expenseChange, pieChartData }: FinancialInsightsProps) {
  const insights = [];
  
  // Budget insight
  if (budget && budget.salary > 0) {
    const percentUsed = (totalExpenses / budget.salary) * 100;
    if (percentUsed > 90) {
      insights.push({
        type: 'warning',
        message: 'You\'ve used over 90% of your budget this month. Consider reducing expenses.',
        icon: '⚠️',
      });
    } else if (percentUsed < 50 && new Date().getDate() > 20) {
      insights.push({
        type: 'positive',
        message: 'You\'re well under budget with just a few days left in the month!',
        icon: '🎉',
      });
    }
  } else {
    insights.push({
      type: 'info',
      message: 'Set a monthly budget to get personalized insights about your spending habits.',
      icon: '💡',
    });
  }
  
  // Spending change insight
  if (expenseChange > 20) {
    insights.push({
      type: 'warning',
      message: `Your spending increased by ${expenseChange.toFixed(1)}% compared to last month.`,
      icon: '📈',
    });
  } else if (expenseChange < -10) {
    insights.push({
      type: 'positive',
      message: `Great job! You decreased your spending by ${Math.abs(expenseChange).toFixed(1)}% compared to last month.`,
      icon: '📉',
    });
  }
  
  // Category insight
  if (pieChartData.length > 0) {
    const topCategory = pieChartData.sort((a, b) => b.value - a.value)[0];
    if (topCategory.percentage > 40) {
      insights.push({
        type: 'info',
        message: `${topCategory.name} makes up ${topCategory.percentage.toFixed(1)}% of your expenses. Consider if you can reduce spending in this category.`,
        icon: '📊',
      });
    }
  }
  
  // If no specific insights, add a general one
  if (insights.length === 0) {
    insights.push({
      type: 'info',
      message: 'Track your expenses consistently to receive personalized financial insights.',
      icon: '📋',
    });
  }
  
  return (
    <div className="card bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 h-full">
      <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">Financial Insights</h2>
      <div className="space-y-4">
        {insights.map((insight, index) => (
          <div 
            key={index} 
            className={`p-3 rounded-lg border ${
              insight.type === 'warning' ? 'bg-red-50 border-red-100 dark:bg-red-900/20 dark:border-red-800' :
              insight.type === 'positive' ? 'bg-green-50 border-green-100 dark:bg-green-900/20 dark:border-green-800' :
              'bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800'
            }`}
          >
            <div className="flex items-start">
              <span className="text-xl mr-3">{insight.icon}</span>
              <p className={`text-sm ${
                insight.type === 'warning' ? 'text-red-800 dark:text-red-300' :
                insight.type === 'positive' ? 'text-green-800 dark:text-green-300' :
                'text-blue-800 dark:text-blue-300'
              }`}>
                {insight.message}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExpensesPieChart({ pieChartData, formatCurrency }: ExpensesPieChartProps) {
  return (
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
              <Tooltip 
                formatter={(value) => formatCurrency(value as number)} 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                  borderRadius: '8px',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                  border: 'none'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          No data available for this month
        </div>
      )}
    </div>
  );
}

function MonthlyTrendChart({ barChartData, formatCurrency }: MonthlyTrendChartProps) {
  return (
    <div className="card bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">Monthly Trend</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={barChartData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => formatCurrency(value as number)} />
            <Legend />
            <Bar dataKey="expenses" fill="#0ea5e9" name="Expenses" />
            <Bar dataKey="budget" fill="#22c55e" name="Budget" />
            <Line
              type="monotone"
              dataKey="budget"
              stroke="#22c55e"
              activeDot={{ r: 8 }}
              strokeWidth={3}
              dot={{ strokeWidth: 2 }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function RecentExpenses({ expenses, categories, formatCurrency }: RecentExpensesProps) {
  return (
    <div className="card bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Recent Expenses</h2>
        <button className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center">
          View all
          <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {expenses && expenses.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {expenses.slice(0, 5).map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <td colSpan={3} className="px-6 py-3 text-sm font-medium text-gray-900 dark:text-white text-right">
                    Subtotal ({Math.min(5, expenses.length)} of {expenses.length} expenses):
                  </td>
                  <td className="px-6 py-3 text-sm font-bold text-gray-900 dark:text-white">
                    {formatCurrency(expenses.slice(0, 5).reduce((sum, expense) => sum + expense.amount, 0))}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="mt-4 flex justify-center">
            <nav className="flex space-x-2" aria-label="Pagination">
              <button className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300">
                Previous
              </button>
              <span className="px-3 py-1 rounded bg-blue-600 text-white border border-blue-600 text-sm font-medium">1</span>
              <button className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300">
                Next
              </button>
            </nav>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2v9a2 2 0 01-2 2h-3m-1 4l-3 3m0 0l-3-3m3 3V10" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No expenses</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">No expenses found for this month.</p>
          <div className="mt-6">
            <button type="button" className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add expense
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


