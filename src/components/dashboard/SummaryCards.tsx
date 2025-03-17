import React from 'react';
import { BudgetPeriod } from '../../types';

interface SummaryCardsProps {
  totalExpenses: number;
  budget: BudgetPeriod | null;
  formatCurrency: (value: number) => string;
  expenseChange: number;
  dailyBudget: number;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ 
  totalExpenses, 
  budget, 
  formatCurrency, 
  expenseChange, 
  dailyBudget 
}) => {
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
          Based on {budget?.remainingBudget || 0} remaining budget this month
        </div>
      </div>

      <div className="card bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-l-4 border-indigo-500">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Monthly Budget</h2>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">
              {budget ? formatCurrency(budget.salary || 0) : 'Not set'}
            </p>
          </div>
          <button className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
            Edit Budget
          </button>
        </div>
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          {budget && budget.salary && budget.salary > 0 
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
};

export default SummaryCards;
