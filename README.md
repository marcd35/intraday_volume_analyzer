# Intraday Volume Analyzer

A React-based tool for analyzing and projecting intraday trading volume against historical averages.

## Overview

The Intraday Volume Analyzer helps traders visualize how current trading volume compares to the 50-day average. It provides real-time projections and allows for granular analysis of hourly volume data.

## Features

-   **Simple Mode**: Quick input for current volume and 50-day average to get an instant projection.
-   **Advanced Mode**: Input granular volume data for specific time slots to see detailed accumulation curves.
-   **Visualizations**: Interactive charts comparing expected vs. actual volume accumulation.
-   **Projections**: Real-time estimates of end-of-day volume based on current pacing.
-   **Smart Parsing**: Understands 'k', 'm', 'b' suffixes (e.g., "1.5m" = 1,500,000).

## Tech Stack

-   **Frontend**: React, Vite
-   **Styling**: Tailwind CSS
-   **Charts**: Recharts
-   **Icons**: Lucide React
-   **Testing**: Vitest, React Testing Library

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

See [GETTING_STARTED.md](./GETTING_STARTED.md) for detailed instructions.
