# Tech Context

## Technologies Used
- **React v19**: For building the user interface with latest React features
- **TypeScript**: For type safety and improved developer experience
- **Dexie.js v4**: IndexedDB wrapper for client-side database storage
- **TanStack React Query v5**: For data fetching, caching, and server state management
- **React Router v7**: For application routing and navigation
- **Tailwind CSS v3**: For utility-first styling approach
- **Vite v6**: As the build tool for fast development and optimized production builds
- **Recharts v2**: For creating data visualizations
- **PapaParse v5**: For CSV parsing functionality

## Development Setup
- Node.js and npm required
- Clone the repository and run `npm install` to install dependencies
- Use `npm run dev` to start the development server with Vite
- Use `npm run build` for production builds
- Use `npm run lint` to run ESLint for code quality

## Technical Constraints
- Client-side only application with no backend server
- Data stored locally in the browser's IndexedDB
- Works offline once loaded
- Targets modern browsers with support for IndexedDB and modern JavaScript features
- Mobile responsive design required for all components

## Dependencies
### Core Dependencies:
- React and React DOM
- TanStack React Query for data fetching
- React Router for navigation
- Dexie.js for IndexedDB management
- Recharts for visualizations

### Utility Libraries:
- PapaParse for CSV parsing
- lodash.debounce for performance optimization
- Tailwind CSS for styling

### Development Dependencies:
- TypeScript for static type checking
- ESLint with plugins for code quality
- Vite and related plugins for build process
