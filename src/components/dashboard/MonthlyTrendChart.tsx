import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line } from 'recharts';

interface MonthlyTrendChartProps {
  barChartData: {
    month: string;
    expenses: number;
    budget: number;
  }[];
  formatCurrency: (value: number) => string;
}

const MonthlyTrendChart: React.FC<MonthlyTrendChartProps> = ({ 
  barChartData, 
  formatCurrency 
}) => {
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
};

export default MonthlyTrendChart;
