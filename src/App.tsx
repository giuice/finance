import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ExpenseManager from './components/ExpenseManager';
import CategoryManager from './components/CategoryManager';
import CSVImport from './components/CSVImport';
import BudgetSettings from './components/BudgetSettings';
import { initializeDatabase } from './db/database';

// Create a client
const queryClient = new QueryClient();

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize the database when the app loads
    const init = async () => {
      try {
        await initializeDatabase();
      } catch (error) {
        console.error('Failed to initialize database:', error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  // Render the active tab content
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Loading...</p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'expenses':
        return <ExpenseManager />;
      case 'categories':
        return <CategoryManager />;
      case 'import':
        return <CSVImport />;
      case 'budget':
        return <BudgetSettings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <Layout onTabChange={setActiveTab} activeTab={activeTab}>
        {renderContent()}
      </Layout>
    </QueryClientProvider>
  );
}

export default App;
