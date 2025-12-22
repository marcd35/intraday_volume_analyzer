# Getting Started with Intraday Volume Analyzer

This guide will help you set up the project locally and understand how to work with the codebase.

## Prerequisites

-   **Node.js**: Version 16.0.0 or higher.
-   **npm**: Included with Node.js.

## Installation

1.  **Clone the repository** (if you haven't already):
    ```bash
    git clone <repository-url>
    cd intraday_volume_analyzer
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

## Running the Application

### Development Mode
To start the development server with hot-reload:
```bash
npm run dev
```
Open your browser and navigate to the URL shown in the terminal (usually `http://localhost:5173`).

### Production Build
To create an optimized production build:
```bash
npm run build
```
The output will be in the `dist` directory. You can preview the production build locally with:
```bash
npm run preview
```

## Running Tests

This project uses Vitest for unit testing.

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch
```

## Project Structure

```
intraday_volume_analyzer/
├── src/
│   ├── components/         # UI Components
│   │   ├── AdvancedModeControls.jsx
│   │   ├── SimpleModeControls.jsx
│   │   ├── VolumeChart.jsx
│   │   └── VolumeStatus.jsx
│   ├── hooks/             # Custom React Hooks
│   │   ├── useMarketTime.js
│   │   └── useVolumeCalculations.js
│   ├── utils/             # Helper functions & constants
│   │   ├── constants.js
│   │   └── formatters.js
│   ├── App.jsx            # Main application component
│   └── main.jsx           # Entry point
├── docs/                  # Documentation
├── public/                # Static assets
└── package.json           # Dependencies and scripts
```

## Key Concepts

-   **Volume Distribution**: The app uses a standard distribution curve (defined in `src/utils/constants.js`) to estimate how volume accumulates throughout a typical trading day.
-   **Simple vs. Advanced**: 
    -   *Simple* assumes the stock follows the standard distribution curve exactly.
    -   *Advanced* allows overriding effective volume at specific hours, which is useful for stocks that had unusual pre-market or midday news.
