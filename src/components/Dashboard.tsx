import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { db } from '../db/database';
import { Expense, Category, BudgetPeriod } from '../types';
import { ChartDataItem } from './dashboard/types';
import MonthNavigator from './dashboard/MonthNavigator';
import SummaryCards from './dashboard/SummaryCards';
import BudgetProgress from './dashboard/BudgetProgress';
import TopSpendingCategories from './dashboard/TopSpendingCategories';
import FinancialInsights from './dashboard/FinancialInsights';
import ExpensesPieChart from './dashboard/ExpensesPieChart';
import MonthlyTrendChart from './dashboard/MonthlyTrendChart';
import RecentExpenses from './dashboard/RecentExpenses';

export default function Dashboard() {
  // ===== HOOKS SECTION =====
  // State hooks
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [barChartData, setBarChartData] = useState<{ month: string; expenses: number; budget: number }[]>([]);
  
  // Query hooks with optimized configuration
  const { data: expenses, isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses', currentMonth, currentYear],
    queryFn: () => db.getExpensesByMonth(currentMonth, currentYear),
    // Use a long stale time to prevent unnecessary refetches
    staleTime: 60 * 1000, // 1 minute
    // Disable automatic refetching on mount
    refetchOnMount: false
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => db.getAllCategories(),
    // Categories rarely change, so we can cache them longer
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: budget, isLoading: budgetLoading } = useQuery({
    queryKey: ['budget', currentMonth, currentYear],
    queryFn: async () => {
      // Get the first day of the month
      const startDate = new Date(currentYear, currentMonth, 1);
      // Get the last day of the month
      const endDate = new Date(currentYear, currentMonth + 1, 0);
      const budget = await db.getBudgetPeriod(startDate, endDate);
      return budget || { 
        salary: 0, 
        totalExpenses: 0, 
        remainingBudget: 0, 
        month: currentMonth, 
        year: currentYear 
      };
    },
    // Use a long stale time to prevent unnecessary refetches
    staleTime: 60 * 1000 // 1 minute
  });

  // Previous month data for comparison
  const { data: previousMonthExpenses } = useQuery({
    queryKey: ['prevExpenses', currentMonth, currentYear],
    queryFn: () => {
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      return db.getExpensesByMonth(prevMonth, prevYear);
    },
    // Previous month data rarely changes, so we can cache it longer
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Only enable this query when we have the current expenses loaded
    enabled: !expensesLoading
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
