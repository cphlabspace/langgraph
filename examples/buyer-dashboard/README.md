# Buyer's Dashboard - Supply Chain Intelligence

A comprehensive supply chain analysis tool that transforms PO data exports into actionable insights with AI-powered demand forecasting, trend analysis, and smart ordering recommendations.

## Features

### Per-Item Analysis

The dashboard provides deep analysis for each item including:

- **Demand Forecast** - 7 months of historical sales data analyzed
- **Trend Detection** - Identifies growing, declining, or stable demand patterns
- **Seasonality Patterns** - Detects seasonal variations in demand
- **Current Stock Position** - Real-time inventory levels and stockout detection
- **Pipeline Analysis** - Outstanding PO tracking and arrival predictions
- **Stock vs Demand Allocation** - Coverage analysis and days until stockout
- **ABC Category Consideration** - Priority weighting based on item value classification

### Smart Prioritization

Items are prioritized based on multiple factors:

1. **ABC Category** - Higher weight for A items (high value)
2. **Urgency Level** - Critical, High, Medium, Low based on coverage
3. **Stockout Risk** - Immediate flagging of zero-stock situations
4. **Trend Impact** - Growing demand items get higher priority
5. **Service Class** - A/B/C service levels with different target coverage

### Automated Recommendations

The system automatically calculates:

- **Order Quantities** - Optimal reorder quantities to reach target coverage
- **Order Timing** - Recommended order-by dates
- **Coverage Goals** - Target days of coverage based on service class
- **Trend Adjustments** - +20% buffer for growing items, -20% for declining
- **Risk Flags** - Clear indicators of stockouts, overdue POs, and allocation issues

## Data Requirements

### Required Columns

The system expects tab-separated data (TSV) with these columns:

- `Order no` - Purchase order number
- `Vendor Name` - Supplier name
- `MPN` - Manufacturer part number (unique item identifier)
- `Description` - Item description
- `Outstanding Qty` - Quantity on outstanding POs
- `Qty on stock` - Current inventory level
- `Sale This Month` - Current month sales
- `Sale-1M` through `Sale-6M` - Sales for previous 6 months

### Optional Columns

These columns enhance the analysis if available:

- `Service Class` - A/B/C service level classification
- `ABC Category` - A1/A2/B1/B2/C1/etc. value classification
- `Expected Receipt Date` - When outstanding POs will arrive
- `Outstanding Amount` - Value of outstanding POs
- `Total SO Qty` - Quantity allocated to sales orders
- `SO Lines` - Number of sales order lines

### Data Format Example

```tsv
Order no	Vendor Name	MPN	Description	Service Class	ABC Category	Expected Receipt Date	Outstanding Qty	Qty on stock	Sale This Month	Sale-1M	Sale-2M	Sale-3M	Sale-4M	Sale-5M	Sale-6M
PO-12345	ACME Corp	WIDGET-100	High Performance Widget	A	A1	2025-11-15	500	120	45	52	48	50	42	38	35
PO-12346	TechSupply	GADGET-200	Standard Gadget	B	B2	2025-11-20	200	0	15	18	22	20	19	17	16
```

## Analysis Methodology

### Demand Forecasting

The system analyzes 7 months of sales history to calculate:

- **Average Daily Sales** - Total sales ÷ 7 months ÷ 30 days
- **Average Monthly Sales** - Mean of the 7 monthly data points
- **Trend Percentage** - Compares recent 3 months vs earlier 4 months
- **Trend Category**:
  - GROWING: Recent avg > Earlier avg by 15%+
  - DECLINING: Recent avg < Earlier avg by 15%+
  - STABLE: Within ±15% range

### Seasonality Detection

Uses coefficient of variation to detect patterns:

- Calculates standard deviation across 7 months
- CV = StdDev / Mean
- If CV > 0.5, seasonality is flagged

### Coverage Calculation

```
Effective Stock = Current Stock + Outstanding POs
Coverage (days) = Effective Stock ÷ Average Daily Sales
```

### Priority Scoring (1-100)

- **Base Score**: 50
- **ABC Weight** (40 points max):
  - A items: +40
  - B items: +25
  - C items: +10
  - D items: +5
- **Urgency Weight** (40 points max):
  - CRITICAL: +40
  - HIGH: +25
  - MEDIUM: +10
  - LOW: +5
- **Stockout Bonus**: +20 points

### Urgency Levels

- **CRITICAL**: Stockout OR coverage < 0 days
- **HIGH**: Coverage < 14 days
- **MEDIUM**: Coverage < 30 days OR (coverage < 60 days AND growing trend) OR (has SO allocation AND coverage < 45 days)
- **LOW**: All other cases

### Order Recommendations

Target coverage by service class:

- **A items**: 60 days
- **B items**: 45 days
- **C items**: 30 days

Order quantity calculation:

```
Target Stock = Avg Daily Sales × Target Coverage Days
Order Qty = Target Stock - (Current Stock + Outstanding)
```

Trend adjustments:

- **Growing**: +20% buffer
- **Declining**: -20% reduction

## Installation

```bash
cd examples/buyer-dashboard
npm install
```

## Running the Application

Development mode:

```bash
npm run dev
```

Build for production:

```bash
npm run build
npm run preview
```

## Usage

1. **Upload Data**
   - Paste your tab-separated PO data export
   - Or click "Load Sample Data" to see a demo

2. **Analyze**
   - Click "Analyze Supply Data"
   - System processes all items and calculates metrics

3. **Review Dashboard**
   - See summary statistics at the top
   - Filter by urgency, ABC category, or search
   - Items sorted by priority (highest first)

4. **Take Action**
   - Review items with "ORDER NOW" recommendations
   - Check order quantities and timing
   - Export results for your purchasing system

## Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **Lucide React** - Icons
- **React Router** - Navigation

## Project Structure

```
buyer-dashboard/
├── src/
│   ├── components/
│   │   ├── ui/              # Reusable UI components
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   └── select.tsx
│   │   ├── BuyerDashboard.tsx  # Main dashboard view
│   │   └── UploadPage.tsx      # Data upload interface
│   ├── services/
│   │   └── supplyAnalyzer.ts   # Core analysis logic
│   ├── lib/
│   │   └── utils.ts            # Utility functions
│   ├── App.tsx                 # App router
│   ├── main.tsx               # Entry point
│   └── index.css              # Global styles
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## Key Functions

### `analyzeSupplyData(poData: string): ItemAnalysis[]`

Main analysis function that:

1. Parses tab-separated data
2. Groups rows by MPN (handles multiple PO lines per item)
3. Analyzes each item with all factors
4. Sorts by priority score
5. Returns array of `ItemAnalysis` objects

### `calculateDemandForecast(row: PODataRow): DemandForecast`

Analyzes 7 months of sales data:

- Calculates averages (daily, monthly)
- Detects trends (growing/declining/stable)
- Identifies seasonality patterns
- Returns forecast object

### `analyzePipeline(rows: PODataRow[]): { ... }`

Processes outstanding POs:

- Aggregates quantities by expected date
- Calculates days until arrival
- Identifies next incoming shipment
- Returns pipeline summary

### `calculateOrderRecommendation(...): { ... }`

Generates order recommendations:

- Determines if order needed
- Calculates optimal quantity
- Applies trend adjustments
- Sets order-by date
- Returns recommendation with reasoning

## Dashboard Metrics

Each item card displays:

- **Rank** - Priority-based ranking (#1 = highest priority)
- **Daily Demand** - Avg sales per day with trend indicator
- **Stock** - Current inventory with stockout flag
- **Incoming** - Outstanding PO quantity and count
- **Coverage** - Days of stock remaining
- **Effective** - Stock + POs combined
- **SO Demand** - Sales order allocations
- **Order Recommendation** - Quantity and timing (if needed)
- **Risk Flags** - Key issues and observations

## Customization

### Target Coverage

Modify target days in `calculateOrderRecommendation()`:

```typescript
const targetCoverage = serviceClass === 'A' ? 60 : serviceClass === 'B' ? 45 : 30;
```

### Trend Thresholds

Adjust trend detection sensitivity in `calculateDemandForecast()`:

```typescript
if (trendPct > 15) {  // Currently 15%
  trend = 'GROWING';
} else if (trendPct < -15) {
  trend = 'DECLINING';
}
```

### Priority Weights

Modify scoring in `calculatePriority()`:

```typescript
// ABC weight (currently 40 points max)
if (abcCategory.startsWith('A')) score += 40;
else if (abcCategory.startsWith('B')) score += 25;
// ...
```

## License

MIT License - See LangGraph repository license

## Contributing

This is an example application in the LangGraph repository. For improvements or issues, please submit to the main LangGraph repo.

## Credits

Built as an example of data analysis and visualization using React and TypeScript.
