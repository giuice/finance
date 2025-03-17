import React from 'react';
import { ChartDataItem } from './types';

interface TopSpendingCategoriesProps {
  pieChartData: ChartDataItem[];
  formatCurrency: (value: number) => string;
  totalExpenses: number;
}

const TopSpendingCategories: React.FC<TopSpendingCategoriesProps> = ({ 
  pieChartData, 
  formatCurrency, 
  totalExpenses 
}) => {
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
};

export default TopSpendingCategories;
