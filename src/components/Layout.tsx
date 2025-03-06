import { ReactNode, Dispatch, SetStateAction, useState, useEffect } from 'react';

interface LayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: Dispatch<SetStateAction<string>>;
}

interface NavItem {
  name: string;
  icon: string;
  id: string;
}

export default function Layout({ children, activeTab, onTabChange }: LayoutProps) {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const navItems: NavItem[] = [
    { name: 'Dashboard', icon: '📊', id: 'dashboard' },
    { name: 'Expenses', icon: '💰', id: 'expenses' },
    { name: 'Import CSV', icon: '📥', id: 'import' },
    { name: 'Budget', icon: '💵', id: 'budget' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                Finance Tracker
              </span>
            </div>
            <div className="flex items-center">
              <button
                onClick={toggleDarkMode}
                className="p-1 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
              >
                <span className="sr-only">Toggle dark mode</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-gray-800 shadow-md h-[calc(100vh-4rem)] sticky top-16">
          <nav className="mt-5 px-2">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => onTabChange(item.id)}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                      activeTab === item.id
                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className="mr-3 text-xl">{item.icon}</span>
                    {item.name}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
