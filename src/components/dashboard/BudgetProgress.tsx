import React from 'react';
import { BudgetPeriod } from '../../types';

interface BudgetProgressProps {
  totalExpenses: number;
  budget: BudgetPeriod | null;
  formatCurrency: (value: number) => string;
  daysLeft: number;
}

const BudgetProgress: React.FC<BudgetProgressProps> = ({ 
  totalExpenses, 
  budget, 
  formatCurrency, 
  daysLeft 
}) => {
  const percentUsed = budget && budget.salary && budget.salary > 0 ? (totalExpenses / budget.salary) * 100 : 0;
  
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
        <span>{budget && budget.salary !== undefined ? formatCurrency(budget.salary) : 'N/A'} total</span>
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
};

export default BudgetProgress;
