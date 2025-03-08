# Copilot Instructions

## Project Patterns

### React and TypeScript Patterns
- Use TypeScript for type safety throughout the application
- Create interfaces for component props
- Use React Query for data fetching and state management
- Implement controlled forms with clear validation
- Follow the repository pattern for database operations via the `db` object

### Component Structure
- Organize complex components into smaller sub-components
- Keep state management close to where it's needed
- Use section comments to organize large components (HOOKS SECTION, DERIVED DATA SECTION, etc.)
- Implement responsive designs for all components

### Database Operations
- Always use the `db` object methods for database operations
- Invalidate queries after mutations with `queryClient.invalidateQueries()`
- Follow the pattern of separating query hooks from mutation hooks

### Code Style
- Format currency values using `formatCurrency` helper function with 'pt-BR' locale
- Use Tailwind utility classes for styling
- Prefer component composition over complex conditional rendering
- Employ descriptive variable and function names

## Project Specifics

### State Management
- Use React Query for server state (database data)
- Use React's built-in state for UI state
- Employ `useMemo` for derived values to prevent unnecessary recalculations

### Data Flow
- Components fetch their own data via React Query hooks
- Mutations update the database and invalidate queries to refresh component data
- Month and year state control which data is displayed across components

### User Preferences
- Display currency in Brazilian Real (R$) format
- Support for installment payments in expenses
- Allow categorization of expenses with color-coding
- Track fixed vs. variable expenses separately

## Common Workflows

### Adding New Features
1. Define types in `types/index.ts`
2. Add database methods in `db/database.ts` if needed
3. Create component in `components/` directory
4. Hook up data fetching with React Query
5. Implement UI with Tailwind CSS

### Implementing New Database Operations
1. Add method to the `FinanceDatabase` class in `database.ts`
2. Use Dexie.js patterns for table operations
3. Create React Query hooks in components that need the data

### CSV Import Processing
1. Use the utilities in `csvParser.ts`
2. Follow the pattern in `CSVImport.tsx` for file handling
3. Preview data before committing to database

## Development Tips
- Use the React Query DevTools during development for debugging
- Remember to handle loading and error states with React Query
- Prefer small, focused components for maintainability
- Add type definitions for all data structures