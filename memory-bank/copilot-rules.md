# Copilot Instructions

## Project Patterns

### React and TypeScript Patterns
- Use TypeScript for type safety throughout the application
- Create interfaces for component props
- Use React Query for data fetching and state management
- Implement controlled forms with clear validation
- Follow the repository pattern for database operations via the `db` object
- Organize component interfaces at the top of component files
- Use component composition for complex dashboard visualizations

### Component Structure
- Organize complex components into smaller sub-components
- Keep state management close to where it's needed
- Use section comments to organize large components (HOOKS SECTION, DERIVED DATA SECTION, etc.)
- Implement responsive designs for all components
- Use grid layouts for dashboard components with appropriate responsive breakpoints

### Database Operations
- Always use the `db` object methods for database operations
- Invalidate queries after mutations with `queryClient.invalidateQueries()`
- Follow the pattern of separating query hooks from mutation hooks
- Use transactions for operations that need to be atomic
- Implement proper error handling in database operations
- Add safeguards against duplicate data entry
- Use bulkAdd for adding multiple records at once for better performance

### Data Visualization
- Use Recharts library for all chart visualizations
- Create custom chart components for specific visualization needs
- Format tooltip data with the standard formatCurrency helper
- Use consistent color schemes across charts
- Provide empty state handling for charts when no data is available
- Add insights and explanations alongside visualizations

### Code Style
- Format currency values using `formatCurrency` helper function with 'pt-BR' locale
- Use Tailwind utility classes for styling
- Prefer component composition over complex conditional rendering
- Employ descriptive variable and function names
- Use semantic color naming in charts (e.g., warning colors for over-budget items)

## Project Specifics

### State Management
- Use React Query for server state (database data)
- Use React's built-in state for UI state
- Employ `useMemo` for derived values to prevent unnecessary recalculations
- Implement staleTime options in React Query for performance optimization
- Use appropriate caching strategies based on data update frequency

### Data Flow
- Components fetch their own data via React Query hooks
- Mutations update the database and invalidate queries to refresh component data
- Month and year state control which data is displayed across components
- Forecasting calculations should be done client-side based on historical data
- Derived data should be calculated with useMemo to prevent unnecessary recalculations

### Performance Optimization
- Cache infrequently changing data with longer staleTime
- Use bulkAdd instead of multiple add operations
- Employ useCallback for functions passed to child components
- Enable React Query hooks only when their dependencies are available
- Keep visualizations in separate components to prevent unnecessary rerenders

### User Preferences
- Display currency in Brazilian Real (R$) format
- Support for installment payments in expenses
- Allow categorization of expenses with color-coding
- Track fixed vs. variable expenses separately
- Default categories should include local preferences (e.g., 'Boteco', 'Supermercado')

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
4. Implement proper error handling and transactions where needed
5. Test operations with various edge cases

### Adding New Visualizations
1. Determine the data needed and implement data processing functions
2. Select appropriate chart type from Recharts
3. Create a dedicated component with proper props interface
4. Implement loading and empty states
5. Add explanatory text or insights related to the visualization

### CSV Import Processing
1. Use the utilities in `csvParser.ts`
2. Follow the pattern in `CSVImport.tsx` for file handling
3. Preview data before committing to database

## Development Tips
- Use the React Query DevTools during development for debugging
- Remember to handle loading and error states with React Query
- Prefer small, focused components for maintainability
- Add type definitions for all data structures
- Use database transactions for related operations
- Check console logs for database initialization and error messages
- Implement cleanup utilities to fix data integrity issues
- Test visualizations with both large and empty datasets