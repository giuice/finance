# System Patterns

## System Architecture
- React frontend with TypeScript for type safety
- Local data storage using Dexie.js (IndexedDB wrapper)
- State management with React Query for data fetching and cache management
- Component-based architecture with clear separation of concerns

## Key Technical Decisions
- Dexie.js for client-side database storage with structured tables:
  - expenses
  - categories
  - monthlyBudgets
- TanStack React Query for server state management, caching, and mutations
- React Router for navigation between main application sections
- Tailwind CSS for styling with custom utility classes for consistent UI elements
- Recharts for data visualizations in the Dashboard

## Design Patterns in Use
- Repository pattern: Database access abstracted through the FinanceDatabase class
- Custom hooks for data fetching and business logic encapsulation
- Component composition for UI reusability
- React Query patterns for efficient data loading and mutation
- Form state management using controlled components

## Component Relationships
- **Layout.tsx**: Main layout wrapper providing navigation and structure
- **BudgetSettings.tsx**: Manages budget configuration and category management
  - Interacts with database.ts for CRUD operations on categories and monthly budgets
  - Uses React Query for data fetching and mutation
- **CSVImport.tsx**: Handles CSV file import functionality
  - Uses csvParser.ts utility for parsing Nubank CSV files
  - Interacts with database.ts to store imported expenses
- **ExpenseManager.tsx**: Handles expense tracking and management
  - CRUD operations for individual expenses
  - Filtering and sorting of expenses
- **Dashboard.tsx**: Visualizes spending patterns and financial insights
  - Uses Recharts for data visualization
  - Aggregates data from expenses, categories, and monthly budgets
- **CategoryManager.tsx**: Sub-component for category management
  - Used within BudgetSettings.tsx
