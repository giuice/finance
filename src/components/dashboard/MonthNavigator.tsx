import React from 'react';

interface MonthNavigatorProps {
  currentMonth: number;
  currentYear: number;
  monthNames: string[];
  onPrevious: () => void;
  onNext: () => void;
}

const MonthNavigator: React.FC<MonthNavigatorProps> = ({ 
  currentMonth, 
  currentYear, 
  monthNames, 
  onPrevious, 
  onNext 
}) => {
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
};

export default MonthNavigator;
