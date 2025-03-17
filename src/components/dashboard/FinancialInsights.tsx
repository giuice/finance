import React from 'react';
import { BudgetPeriod } from '../../types';
import { ChartDataItem } from './types';

interface FinancialInsightsProps {
  budget: BudgetPeriod | null;
  totalExpenses: number;
  expenseChange: number;
  pieChartData: ChartDataItem[];
}

interface Insight {
  type: 'warning' | 'positive' | 'info';
  message: string;
  icon: string;
}

const FinancialInsights: React.FC<FinancialInsightsProps> = ({ 
  budget, 
  totalExpenses, 
  expenseChange, 
  pieChartData 
}) => {
  const insights: Insight[] = [];
  
  // Budget insight
  if (budget && budget.salary && budget.salary > 0) {
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
};

export default FinancialInsights;
