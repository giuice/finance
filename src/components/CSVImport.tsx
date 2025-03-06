import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { parseNubankCSV, readFileAsText } from '../utils/csvParser';
import { db } from '../db/database';
import { ParsedCSVRow, Expense } from '../types';

export default function CSVImport() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedCSVRow[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  
  // Add expenses mutation
  const addExpensesMutation = useMutation({
    mutationFn: async (expenses: Expense[]) => {
      for (const expense of expenses) {
        await db.addExpense(expense);
      }
      return expenses.length;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setImportSuccess(true);
      resetForm();
    }
  });
  
  // Reset form
  const resetForm = () => {
    setFile(null);
    setParsedData(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportSuccess(false);
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    await processFile(selectedFile);
  };
  
  // Handle drag events
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setImportSuccess(false);
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;
    
    await processFile(droppedFile);
  };
  
  // Process the CSV file
  const processFile = async (file: File) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check if it's a CSV file
      if (!file.name.endsWith('.csv')) {
        throw new Error('Please upload a CSV file');
      }
      
      setFile(file);
      
      // Read and parse the file
      const fileContent = await readFileAsText(file);
      const parsedRows = await parseNubankCSV(fileContent);
      
      if (parsedRows.length === 0) {
        throw new Error('No data found in the CSV file');
      }
      
      setParsedData(parsedRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while processing the file');
      setFile(null);
      setParsedData(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle import confirmation
  const handleImport = () => {
    if (!parsedData) return;
    
    // Convert ParsedCSVRow to Expense
    const expenses: Expense[] = parsedData.map(row => ({
      date: row.date,
      description: row.description,
      amount: row.amount,
      category: row.category || 'Other',
      isFixedExpense: row.isFixedExpense,
      installment: row.installment
    }));
    
    addExpensesMutation.mutate(expenses);
  };
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Import CSV</h1>
      
      {/* Success message */}
      {importSuccess && (
        <div className="mb-6 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 dark:bg-green-900 dark:text-green-300" role="alert">
          <p className="font-bold">Success!</p>
          <p>Your expenses have been imported successfully.</p>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="mb-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 dark:bg-red-900 dark:text-red-300" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
      
      {/* File upload area */}
      {!parsedData && (
        <div className="mb-8">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center ${
              isDragging
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-300 dark:border-gray-700'
            }`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center">
              <svg className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="mb-2 text-lg font-semibold text-gray-700 dark:text-gray-300">
                {isDragging ? 'Drop your CSV file here' : 'Drag and drop your CSV file here'}
              </p>
              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                or click to browse files
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-primary"
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Select CSV File'}
              </button>
            </div>
          </div>
          
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Instructions</h2>
            <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-1">
              <li>Export your Nubank statement as a CSV file</li>
              <li>Make sure the CSV file has the columns: Date, Description, Amount (BRL)</li>
              <li>Drag and drop the file above or click to select it</li>
              <li>Review the data before importing</li>
            </ul>
          </div>
        </div>
      )}
      
      {/* Data preview */}
      {parsedData && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
              Preview ({parsedData.length} expenses)
            </h2>
            <div className="flex space-x-3">
              <button
                onClick={resetForm}
                className="btn-secondary"
                disabled={addExpensesMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                className="btn-primary"
                disabled={addExpensesMutation.isPending}
              >
                {addExpensesMutation.isPending ? 'Importing...' : 'Import Expenses'}
              </button>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
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
                  {parsedData.map((row, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {row.date.toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {row.description}
                        {row.installment && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 rounded-full">
                            {row.installment.current}/{row.installment.total}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {row.category || 'Other'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatCurrency(row.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="mt-4 text-right">
            <p className="text-gray-600 dark:text-gray-400">
              Total: <span className="font-semibold">{formatCurrency(parsedData.reduce((sum, row) => sum + row.amount, 0))}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
