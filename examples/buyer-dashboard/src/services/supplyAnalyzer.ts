/**
 * Supply Chain Analysis Service
 *
 * Provides comprehensive per-item analysis including:
 * - Demand forecasting from 7 months of historical data
 * - Trend detection (growing/declining/stable)
 * - Seasonality pattern analysis
 * - Current stock position tracking
 * - Pipeline analysis (outstanding POs)
 * - Stock vs Demand allocation
 * - ABC category consideration for prioritization
 */

export interface PODataRow {
  orderNo: string;
  vendorName: string;
  mpn: string;
  description: string;
  serviceClass: string;
  abcCategory: string;
  receiptDateStatus: string;
  expectedReceiptDate: string;
  outstandingQty: number;
  outstandingAmount: number;
  qtyOnStock: number;
  saleThisMonth: number;
  sale1M: number;
  sale2M: number;
  sale3M: number;
  sale4M: number;
  sale5M: number;
  sale6M: number;
  totalSOQty?: number;
  soLines?: number;
}

export interface DemandForecast {
  avgDailySales: number;
  avgMonthlySales: number;
  trend: 'GROWING' | 'DECLINING' | 'STABLE';
  trendPct: number;
  seasonalityDetected: boolean;
  monthlyData: number[];
  recentMonthsAvg: number; // Last 3 months
  earlierMonthsAvg: number; // Months 4-7
}

export interface PipelineItem {
  orderNo: string;
  expectedDate: string;
  daysAway: number;
  outstandingQty: number;
  outstandingAmount: number;
}

export interface StockPosition {
  currentStock: number;
  totalOutstanding: number;
  effectiveStock: number; // current + outstanding
  coverage: number; // days of coverage at current demand
  isStockout: boolean;
}

export interface ItemAnalysis {
  // Identification
  mpn: string;
  description: string;
  vendor: string;

  // Classification
  abcCategory: string;
  serviceClass: string;

  // Demand Analysis (7 months!)
  avgDailySales: number;
  avgMonthlySales: number;
  trendCategory: 'GROWING' | 'DECLINING' | 'STABLE';
  trendPct: number;
  seasonalityDetected: boolean;
  monthlyDemand: number[];

  // Stock Position
  currentStock: number;
  isStockout: boolean;

  // Pipeline (Outstanding POs)
  totalOutstanding: number;
  pos: PipelineItem[];
  nextArrival: PipelineItem | null;

  // Stock vs Demand
  effectiveStock: number;
  coverage: number; // days
  daysUntilStockout: number;

  // SO Demand Allocation
  totalSOQty: number;
  soLines: number;
  hasDemandAllocation: boolean;
  allocatedCoverage: number; // days covered by allocated SOs

  // Recommendations
  shouldOrder: boolean;
  recommendedOrderQty: number;
  orderByDate: Date | null;
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  priority: number; // 1-100 score

  // Reasoning
  reasoning: string[];
}

/**
 * Calculate demand forecast from 7 months of sales history
 */
function calculateDemandForecast(row: PODataRow): DemandForecast {
  const monthlyData = [
    row.saleThisMonth || 0,
    row.sale1M || 0,
    row.sale2M || 0,
    row.sale3M || 0,
    row.sale4M || 0,
    row.sale5M || 0,
    row.sale6M || 0,
  ];

  const totalSales = monthlyData.reduce((a, b) => a + b, 0);
  const avgMonthlySales = totalSales / 7;
  const avgDailySales = avgMonthlySales / 30;

  // Trend detection: compare recent 3 months vs earlier 4 months
  const recentMonthsAvg = (monthlyData[0] + monthlyData[1] + monthlyData[2]) / 3;
  const earlierMonthsAvg = (monthlyData[3] + monthlyData[4] + monthlyData[5] + monthlyData[6]) / 4;

  let trend: 'GROWING' | 'DECLINING' | 'STABLE' = 'STABLE';
  let trendPct = 0;

  if (earlierMonthsAvg > 0) {
    trendPct = ((recentMonthsAvg - earlierMonthsAvg) / earlierMonthsAvg) * 100;

    if (trendPct > 15) {
      trend = 'GROWING';
    } else if (trendPct < -15) {
      trend = 'DECLINING';
    }
  }

  // Simple seasonality detection: check variance
  const mean = avgMonthlySales;
  const variance = monthlyData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / 7;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = mean > 0 ? stdDev / mean : 0;

  // If coefficient of variation > 0.5, consider it seasonal
  const seasonalityDetected = coefficientOfVariation > 0.5;

  return {
    avgDailySales,
    avgMonthlySales,
    trend,
    trendPct,
    seasonalityDetected,
    monthlyData,
    recentMonthsAvg,
    earlierMonthsAvg,
  };
}

/**
 * Analyze pipeline (outstanding POs)
 */
function analyzePipeline(rows: PODataRow[]): {
  totalOutstanding: number;
  pos: PipelineItem[];
  nextArrival: PipelineItem | null;
} {
  const pos: PipelineItem[] = rows
    .filter(r => r.outstandingQty > 0)
    .map(r => {
      const expectedDate = r.expectedReceiptDate || '';
      const daysAway = calculateDaysAway(expectedDate);

      return {
        orderNo: r.orderNo,
        expectedDate,
        daysAway,
        outstandingQty: r.outstandingQty,
        outstandingAmount: r.outstandingAmount,
      };
    })
    .sort((a, b) => a.daysAway - b.daysAway);

  const totalOutstanding = pos.reduce((sum, po) => sum + po.outstandingQty, 0);
  const nextArrival = pos.length > 0 ? pos[0] : null;

  return { totalOutstanding, pos, nextArrival };
}

/**
 * Calculate days until a date
 */
function calculateDaysAway(dateStr: string): number {
  if (!dateStr) return 999;

  try {
    const date = new Date(dateStr);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  } catch {
    return 999;
  }
}

/**
 * Calculate stock position and coverage
 */
function calculateStockPosition(
  currentStock: number,
  totalOutstanding: number,
  avgDailySales: number
): StockPosition {
  const effectiveStock = currentStock + totalOutstanding;
  const isStockout = currentStock <= 0;

  // Coverage in days
  const coverage = avgDailySales > 0 ? effectiveStock / avgDailySales : 999;

  return {
    currentStock,
    totalOutstanding,
    effectiveStock,
    coverage,
    isStockout,
  };
}

/**
 * Calculate priority score (1-100) based on ABC category and urgency
 */
function calculatePriority(
  abcCategory: string,
  urgency: string,
  isStockout: boolean
): number {
  let score = 50; // Base score

  // ABC weight (40 points max)
  if (abcCategory.startsWith('A')) score += 40;
  else if (abcCategory.startsWith('B')) score += 25;
  else if (abcCategory.startsWith('C')) score += 10;
  else score += 5; // D items

  // Urgency weight (40 points max)
  if (urgency === 'CRITICAL') score += 40;
  else if (urgency === 'HIGH') score += 25;
  else if (urgency === 'MEDIUM') score += 10;
  else score += 5;

  // Stockout bonus (20 points)
  if (isStockout) score += 20;

  return Math.min(100, score);
}

/**
 * Determine urgency level based on coverage and trends
 */
function determineUrgency(
  coverage: number,
  isStockout: boolean,
  trend: string,
  hasDemandAllocation: boolean
): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
  if (isStockout || coverage < 0) return 'CRITICAL';
  if (coverage < 14) return 'HIGH';
  if (coverage < 30) return 'MEDIUM';
  if (coverage < 60 && trend === 'GROWING') return 'MEDIUM';
  if (hasDemandAllocation && coverage < 45) return 'MEDIUM';
  return 'LOW';
}

/**
 * Calculate recommended order quantity
 */
function calculateOrderRecommendation(
  avgDailySales: number,
  currentStock: number,
  totalOutstanding: number,
  coverage: number,
  trend: string,
  serviceClass: string
): { shouldOrder: boolean; qty: number; orderByDate: Date | null; reasoning: string[] } {
  const reasoning: string[] = [];
  let shouldOrder = false;
  let qty = 0;
  let orderByDate: Date | null = null;

  // Target coverage based on service class
  const targetCoverage = serviceClass === 'A' ? 60 : serviceClass === 'B' ? 45 : 30;

  // Check if we need to order
  if (coverage < targetCoverage) {
    shouldOrder = true;

    // Calculate order quantity to reach target coverage
    const targetStock = avgDailySales * targetCoverage;
    const currentEffective = currentStock + totalOutstanding;
    qty = Math.max(0, Math.ceil(targetStock - currentEffective));

    // Adjust for trend
    if (trend === 'GROWING') {
      qty = Math.ceil(qty * 1.2); // 20% buffer for growth
      reasoning.push('Adjusted +20% for growing demand');
    } else if (trend === 'DECLINING') {
      qty = Math.ceil(qty * 0.8); // Reduce for declining
      reasoning.push('Adjusted -20% for declining demand');
    }

    // Calculate order by date
    const daysUntilTarget = coverage - 14; // Order when 2 weeks from target
    if (daysUntilTarget > 0) {
      orderByDate = new Date();
      orderByDate.setDate(orderByDate.getDate() + Math.max(0, daysUntilTarget));
    } else {
      orderByDate = new Date(); // Order now!
    }

    reasoning.push(`Coverage ${coverage.toFixed(0)}d < target ${targetCoverage}d`);
  }

  return { shouldOrder, qty, orderByDate, reasoning };
}

/**
 * Analyze a single item with all factors
 */
function analyzeItem(rows: PODataRow[]): ItemAnalysis {
  if (rows.length === 0) {
    throw new Error('No data rows provided');
  }

  const firstRow = rows[0];
  const reasoning: string[] = [];

  // Demand Forecast (7 months!)
  const forecast = calculateDemandForecast(firstRow);

  // Pipeline Analysis
  const pipeline = analyzePipeline(rows);

  // Stock Position
  const stockPos = calculateStockPosition(
    firstRow.qtyOnStock,
    pipeline.totalOutstanding,
    forecast.avgDailySales
  );

  // SO Demand Allocation
  const totalSOQty = firstRow.totalSOQty || 0;
  const soLines = firstRow.soLines || 0;
  const hasDemandAllocation = totalSOQty > 0;
  const allocatedCoverage = forecast.avgDailySales > 0
    ? totalSOQty / forecast.avgDailySales
    : 0;

  // Calculate days until stockout
  const daysUntilStockout = forecast.avgDailySales > 0
    ? firstRow.qtyOnStock / forecast.avgDailySales
    : 999;

  // Add reasoning
  if (stockPos.isStockout) {
    reasoning.push('STOCKOUT - immediate action required');
  }
  if (forecast.trend === 'GROWING') {
    reasoning.push(`Growing demand: +${forecast.trendPct.toFixed(0)}%`);
  } else if (forecast.trend === 'DECLINING') {
    reasoning.push(`Declining demand: ${forecast.trendPct.toFixed(0)}%`);
  }
  if (forecast.seasonalityDetected) {
    reasoning.push('Seasonal patterns detected');
  }
  if (hasDemandAllocation) {
    reasoning.push(`${totalSOQty} units allocated to ${soLines} SO lines`);
  }
  if (pipeline.pos.length === 0 && !stockPos.isStockout) {
    reasoning.push('No incoming POs - monitor closely');
  }
  if (pipeline.nextArrival && pipeline.nextArrival.daysAway < 0) {
    reasoning.push('Overdue PO - follow up with vendor');
  }

  // Determine urgency
  const urgency = determineUrgency(
    stockPos.coverage,
    stockPos.isStockout,
    forecast.trend,
    hasDemandAllocation
  );

  // Order recommendation
  const orderRec = calculateOrderRecommendation(
    forecast.avgDailySales,
    firstRow.qtyOnStock,
    pipeline.totalOutstanding,
    stockPos.coverage,
    forecast.trend,
    firstRow.serviceClass
  );

  reasoning.push(...orderRec.reasoning);

  // Priority score
  const priority = calculatePriority(
    firstRow.abcCategory,
    urgency,
    stockPos.isStockout
  );

  return {
    // Identification
    mpn: firstRow.mpn,
    description: firstRow.description,
    vendor: firstRow.vendorName,

    // Classification
    abcCategory: firstRow.abcCategory,
    serviceClass: firstRow.serviceClass,

    // Demand Analysis
    avgDailySales: forecast.avgDailySales,
    avgMonthlySales: forecast.avgMonthlySales,
    trendCategory: forecast.trend,
    trendPct: forecast.trendPct,
    seasonalityDetected: forecast.seasonalityDetected,
    monthlyDemand: forecast.monthlyData,

    // Stock Position
    currentStock: firstRow.qtyOnStock,
    isStockout: stockPos.isStockout,

    // Pipeline
    totalOutstanding: pipeline.totalOutstanding,
    pos: pipeline.pos,
    nextArrival: pipeline.nextArrival,

    // Stock vs Demand
    effectiveStock: stockPos.effectiveStock,
    coverage: stockPos.coverage,
    daysUntilStockout,

    // SO Allocation
    totalSOQty,
    soLines,
    hasDemandAllocation,
    allocatedCoverage,

    // Recommendations
    shouldOrder: orderRec.shouldOrder,
    recommendedOrderQty: orderRec.qty,
    orderByDate: orderRec.orderByDate,
    urgency,
    priority,

    // Reasoning
    reasoning,
  };
}

/**
 * Parse tab-separated PO data export
 */
export function parsePOData(data: string): PODataRow[] {
  const lines = data.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('No data found - need at least header and one data row');
  }

  const headers = lines[0].split('\t').map(h => h.trim());
  const rows: PODataRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split('\t');
    const row: any = {};

    headers.forEach((header, idx) => {
      const value = values[idx]?.trim() || '';

      // Map headers to object properties
      switch (header.toLowerCase()) {
        case 'order no':
        case 'orderno':
          row.orderNo = value;
          break;
        case 'vendor name':
        case 'vendorname':
          row.vendorName = value;
          break;
        case 'mpn':
          row.mpn = value;
          break;
        case 'description':
          row.description = value;
          break;
        case 'service class':
        case 'serviceclass':
          row.serviceClass = value;
          break;
        case 'abc category':
        case 'abccategory':
          row.abcCategory = value;
          break;
        case 'receipt date status':
        case 'receiptdatestatus':
          row.receiptDateStatus = value;
          break;
        case 'expected receipt date':
        case 'expectedreceiptdate':
          row.expectedReceiptDate = value;
          break;
        case 'outstanding qty':
        case 'outstandingqty':
          row.outstandingQty = parseFloat(value) || 0;
          break;
        case 'outstanding amount':
        case 'outstandingamount':
          row.outstandingAmount = parseFloat(value) || 0;
          break;
        case 'qty on stock':
        case 'qtyonstock':
          row.qtyOnStock = parseFloat(value) || 0;
          break;
        case 'sale this month':
        case 'salethismonth':
          row.saleThisMonth = parseFloat(value) || 0;
          break;
        case 'sale-1m':
        case 'sale1m':
          row.sale1M = parseFloat(value) || 0;
          break;
        case 'sale-2m':
        case 'sale2m':
          row.sale2M = parseFloat(value) || 0;
          break;
        case 'sale-3m':
        case 'sale3m':
          row.sale3M = parseFloat(value) || 0;
          break;
        case 'sale-4m':
        case 'sale4m':
          row.sale4M = parseFloat(value) || 0;
          break;
        case 'sale-5m':
        case 'sale5m':
          row.sale5M = parseFloat(value) || 0;
          break;
        case 'sale-6m':
        case 'sale6m':
          row.sale6M = parseFloat(value) || 0;
          break;
        case 'total so qty':
        case 'totalsoqty':
          row.totalSOQty = parseFloat(value) || 0;
          break;
        case 'so lines':
        case 'solines':
          row.soLines = parseFloat(value) || 0;
          break;
      }
    });

    if (row.mpn) {
      rows.push(row as PODataRow);
    }
  }

  return rows;
}

/**
 * Main analysis function - analyzes all items from PO data export
 */
export function analyzeSupplyData(poData: string): ItemAnalysis[] {
  const rows = parsePOData(poData);

  // Group rows by MPN (multiple PO lines for same item)
  const groupedByMPN = new Map<string, PODataRow[]>();

  rows.forEach(row => {
    const existing = groupedByMPN.get(row.mpn) || [];
    existing.push(row);
    groupedByMPN.set(row.mpn, existing);
  });

  // Analyze each item
  const analyses: ItemAnalysis[] = [];

  groupedByMPN.forEach((itemRows, mpn) => {
    try {
      const analysis = analyzeItem(itemRows);
      analyses.push(analysis);
    } catch (error) {
      console.error(`Error analyzing ${mpn}:`, error);
    }
  });

  // Sort by priority (highest first)
  analyses.sort((a, b) => b.priority - a.priority);

  return analyses;
}

/**
 * Generate sample PO data for testing
 */
export function generateSampleData(): string {
  return `Order no\tVendor Name\tMPN\tDescription\tService Class\tABC Category\tReceipt Date Status\tExpected Receipt Date\tOutstanding Qty\tOutstanding Amount\tQty on stock\tSale This Month\tSale-1M\tSale-2M\tSale-3M\tSale-4M\tSale-5M\tSale-6M\tTotal SO Qty\tSO Lines
PO-12345\tACME Corp\tWIDGET-100\tHigh Performance Widget\tA\tA1\tConfirmed\t2025-11-15\t500\t5000\t120\t45\t52\t48\t50\t42\t38\t35\t180\t5
PO-12346\tTechSupply\tGADGET-200\tStandard Gadget\tB\tB2\tPending\t2025-11-20\t200\t1200\t0\t15\t18\t22\t20\t19\t17\t16\t25\t2
PO-12347\tMegaVendor\tGIZMO-300\tPremium Gizmo\tA\tA2\tOverdue\t2025-10-30\t100\t3000\t50\t8\t12\t15\t18\t22\t25\t28\t40\t3
PO-12348\tSupplyCo\tDOOHICKEY-400\tBasic Doohickey\tC\tC1\tConfirmed\t2025-12-01\t1000\t2000\t500\t35\t32\t38\t30\t28\t25\t22\t50\t4
PO-12349\tPartsPro\tTHINGAMAJIG-500\tDeluxe Thingamajig\tB\tB1\tConfirmed\t2025-11-10\t300\t4500\t25\t60\t55\t50\t45\t40\t35\t30\t120\t8`;
}
