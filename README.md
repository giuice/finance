# Finance App

## Description

This is a personal finance management application built with React, TypeScript, and Vite. It allows users to track their expenses, set budgets, and import data from CSV files.

## Features

*   **Expense Management:** Add, edit, and delete expense entries.
*   **Budget Settings:** Set and manage budget limits for different categories.
*   **CSV Import:** Import expense data from CSV files.
*   **Dashboard:** Visualize financial data with interactive charts and summaries.

## Installation

1.  Clone the repository:

    ```bash
    git clone https://github.com/giuice/finance.git
    ```

2.  Navigate to the project directory:

    ```bash
    cd finance
    ```

3.  Install dependencies:

    ```bash
    npm install
    ```

## Usage

To run the app locally:

```bash
npm run dev
```

This will start the development server, and you can access the app in your browser (usually at `http://localhost:5173`).

## Technologies Used

*   React
*   TypeScript
*   Vite
*   Tailwind CSS
*   IndexedDB (for local data storage)
*   ESLint (for code linting)

## File Structure

```
finance/
├── public/             # Static assets
├── src/
│   ├── assets/         # Images and other assets
│   ├── components/     # React components
│   ├── db/             # Database interaction logic
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   ├── App.tsx         # Main application component
│   ├── main.tsx        # Entry point
│   └── index.css       # Global styles
├── .gitignore          # Files and directories to ignore in Git
├── index.html          # HTML template
├── package.json        # Project metadata and dependencies
├── postcss.config.js   # PostCSS configuration
├── tailwind.config.js  # Tailwind CSS configuration
├── tsconfig.json       # TypeScript configuration
└── vite.config.ts      # Vite configuration
