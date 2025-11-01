# InvenSense AI

Smart Purchase Order Analysis for Buyers - AI-powered supply chain intelligence.

## Overview

InvenSense AI is a web application that analyzes purchase order data and provides intelligent buying recommendations. It helps buyers prioritize their work, identify risks, and make data-driven ordering decisions.

## Features

- **Smart Prioritization**: AI-powered urgency scoring based on stock levels, demand trends, and ABC category
- **Trend Analysis**: Detects growing/declining demand patterns from 7 months of sales history
- **Order Recommendations**: Calculates optimal order quantities and timing to maintain healthy stock levels
- **Coverage Analysis**: Visualizes days of stock coverage with incoming PO consideration
- **Risk Detection**: Flags stockouts, low coverage, and demand allocation issues
- **Interactive Dashboard**: Filter and search through prioritized items with rich metrics

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
cd inven-sense-ai
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

### Build

```bash
npm run build
```

## Usage

1. **Export PO Data**: Export your purchase order data from your ERP system as tab-separated values
2. **Upload**: Paste the data into the upload page (or use the sample data button)
3. **Analyze**: Click "Analyze Data" to process the information
4. **Review**: View prioritized items with buying recommendations on the dashboard

### Required Data Format

Your data export should include the following columns (tab-separated):

- Order no
- Vendor Name
- MPN
- Description
- Service Class
- ABC Category
- Receipt Date Status
- Expected Receipt Date
- Outstanding Qty
- Outstanding Amount
- Qty on stock
- Sale This Month
- Sale-1M through Sale-6M
- SO Qty
- Demand Allocation

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Routing**: React Router v6
- **Styling**: Tailwind CSS with shadcn/ui components
- **Icons**: Lucide React
- **Build Tool**: Vite

## Project Structure

```
inven-sense-ai/
├── src/
│   ├── components/
│   │   ├── ui/              # Reusable UI components
│   │   ├── BuyerDashboard.tsx
│   │   └── UploadPage.tsx
│   ├── services/
│   │   └── supplyAnalyzer.ts # Core analysis logic
│   ├── lib/
│   │   └── utils.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## Analysis Logic

The supply analyzer performs the following calculations:

1. **Demand Trending**: Compares recent 3-month sales to historical 3-month average
2. **Coverage Calculation**: Days of stock = (Current Stock + Incoming POs) / Average Daily Sales
3. **Urgency Scoring**: Based on coverage, stockout status, demand allocation, and trend
4. **Priority Ranking**: Combines urgency, ABC category, and risk factors
5. **Order Recommendations**: Calculates target stock (60-90 days based on trend) and recommended order quantity

## License

MIT

## Author

Built for supply chain professionals who want to work smarter, not harder.
