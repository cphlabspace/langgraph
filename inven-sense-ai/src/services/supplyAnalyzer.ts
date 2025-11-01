/**
 * Supply Chain Analysis Service
 * Analyzes purchase order data and provides buying recommendations
 */

export interface PODataRow {
  'Order no': string;
  'Vendor Name': string;
  'MPN': string;
  'Description': string;
  'Service Class': string;
  'ABC Category': string;
  'Receipt Date Status': string;
  'Expected Receipt Date': string;
  'Outstanding Qty': number;
  'Outstanding Amount': number;
  'Qty on stock': number;
  'Sale This Month': number;
  'Sale-1M': number;
  'Sale-2M': number;
  'Sale-3M': number;
  'Sale-4M': number;
  'Sale-5M': number;
  'Sale-6M': number;
  'SO Qty': number;
  'Demand Allocation': string;
}

export interface POItem {
  orderNo: string;
  expectedDate: Date;
  outstandingQty: number;
  outstandingAmount: number;
  daysAway: number;
  status: string; // Confirmed, Unknown, Pending, etc.
}

export interface ItemAnalysis {
  mpn: string;
  description: string;
  vendor: string;
  serviceClass: string;
  abcCategory: string;

  // Stock position
  currentStock: number;
  totalOutstanding: number;
  effectiveStock: number;
  isStockout: boolean;

  // Purchase orders
  pos: POItem[];
  nextArrival: POItem | null;

  // Demand analysis
  avgDailySales: number;
  recentMonthSales: number;
  historicalMonthSales: number;
  trendPct: number;
  trendCategory: 'GROWING' | 'STABLE' | 'DECLINING';

  // SO demand
  totalSOQty: number;
  hasDemandAllocation: boolean;

  // Coverage analysis
  coverage: number; // days of stock
  coverageAfterNextPO: number;

  // Priority and urgency
  priority: number; // 1-100 score
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

  // Recommendations
  shouldOrder: boolean;
  recommendedOrderQty: number;
  orderByDate: Date | null;
  reasoning: string[];
}

/**
 * Parse tab-separated PO data
 */
export function parsePOData(rawData: string): PODataRow[] {
  const lines = rawData.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('No data provided');
  }

  const headers = lines[0].split('\t');
  const rows: PODataRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split('\t');
    if (values.length < headers.length) continue;

    const row: any = {};
    headers.forEach((header, idx) => {
      const value = values[idx]?.trim() || '';

      // Parse numeric fields
      if (header.includes('Qty') || header.includes('Amount') || header.includes('Sale')) {
        row[header] = parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;
      } else {
        row[header] = value;
      }
    });

    rows.push(row as PODataRow);
  }

  return rows;
}

/**
 * Group PO rows by MPN
 */
function groupByMPN(rows: PODataRow[]): Map<string, PODataRow[]> {
  const grouped = new Map<string, PODataRow[]>();

  for (const row of rows) {
    const mpn = row.MPN;
    if (!grouped.has(mpn)) {
      grouped.set(mpn, []);
    }
    grouped.get(mpn)!.push(row);
  }

  return grouped;
}

/**
 * Calculate trend from sales history
 */
function calculateTrend(row: PODataRow): { trendPct: number; category: 'GROWING' | 'STABLE' | 'DECLINING' } {
  const recent = row['Sale This Month'] + row['Sale-1M'] + row['Sale-2M'];
  const historical = row['Sale-3M'] + row['Sale-4M'] + row['Sale-5M'];

  if (historical === 0) {
    return { trendPct: 0, category: 'STABLE' };
  }

  const trendPct = ((recent - historical) / historical) * 100;

  let category: 'GROWING' | 'STABLE' | 'DECLINING';
  if (trendPct > 15) category = 'GROWING';
  else if (trendPct < -15) category = 'DECLINING';
  else category = 'STABLE';

  return { trendPct, category };
}

/**
 * Calculate average daily sales from 7 months of history
 */
function calculateAvgDailySales(row: PODataRow): number {
  const totalSales =
    row['Sale This Month'] +
    row['Sale-1M'] +
    row['Sale-2M'] +
    row['Sale-3M'] +
    row['Sale-4M'] +
    row['Sale-5M'] +
    row['Sale-6M'];

  // 7 months * 30 days = 210 days
  return totalSales / 210;
}

/**
 * Parse incoming POs for an item
 */
function parseIncomingPOs(rows: PODataRow[]): POItem[] {
  const pos: POItem[] = [];
  const today = new Date();

  for (const row of rows) {
    if (row['Outstanding Qty'] > 0) {
      const expectedDate = new Date(row['Expected Receipt Date']);
      const daysAway = Math.ceil((expectedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      pos.push({
        orderNo: row['Order no'],
        expectedDate,
        outstandingQty: row['Outstanding Qty'],
        outstandingAmount: row['Outstanding Amount'],
        daysAway,
        status: row['Receipt Date Status']
      });
    }
  }

  // Sort by expected date
  pos.sort((a, b) => a.expectedDate.getTime() - b.expectedDate.getTime());

  return pos;
}

/**
 * Calculate coverage in days
 */
function calculateCoverage(stock: number, dailySales: number): number {
  if (dailySales === 0) return 999;
  return stock / dailySales;
}

/**
 * Calculate priority score (1-100)
 * Higher score = higher priority
 */
function calculatePriority(
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
  abcCategory: string,
  coverage: number,
  isStockout: boolean
): number {
  let score = 50;

  // Urgency weight (0-40 points)
  if (urgency === 'CRITICAL') score += 40;
  else if (urgency === 'HIGH') score += 30;
  else if (urgency === 'MEDIUM') score += 15;
  else score += 5;

  // ABC category weight (0-30 points)
  if (abcCategory.startsWith('A')) score += 30;
  else if (abcCategory.startsWith('B')) score += 20;
  else if (abcCategory.startsWith('C')) score += 10;
  else score += 5;

  // Coverage penalty (0-20 points)
  if (coverage < 7) score += 20;
  else if (coverage < 14) score += 15;
  else if (coverage < 30) score += 10;
  else if (coverage < 60) score += 5;

  // Stockout bonus (0-10 points)
  if (isStockout) score += 10;

  return Math.min(100, score);
}

/**
 * Determine urgency level
 */
function determineUrgency(
  coverage: number,
  isStockout: boolean,
  hasDemandAllocation: boolean,
  trendCategory: string
): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
  if (isStockout && hasDemandAllocation) return 'CRITICAL';
  if (isStockout) return 'HIGH';
  if (coverage < 7) return 'CRITICAL';
  if (coverage < 14 && trendCategory === 'GROWING') return 'HIGH';
  if (coverage < 30) return 'HIGH';
  if (coverage < 60) return 'MEDIUM';
  return 'LOW';
}

/**
 * Calculate recommended order quantity
 * Target: 60 days of coverage
 */
function calculateOrderRecommendation(
  currentStock: number,
  totalOutstanding: number,
  avgDailySales: number,
  trendCategory: string
): { shouldOrder: boolean; qty: number; reasoning: string[] } {
  const reasoning: string[] = [];
  const effectiveStock = currentStock + totalOutstanding;
  const coverage = calculateCoverage(effectiveStock, avgDailySales);

  // Adjust target based on trend
  let targetDays = 60;
  if (trendCategory === 'GROWING') {
    targetDays = 90;
    reasoning.push('Growing demand trend');
  } else if (trendCategory === 'DECLINING') {
    targetDays = 45;
    reasoning.push('Declining demand trend');
  }

  const targetStock = avgDailySales * targetDays;
  const shortfall = targetStock - effectiveStock;

  if (shortfall > 0) {
    // Round to sensible quantity
    const roundedQty = Math.ceil(shortfall / 10) * 10;
    return {
      shouldOrder: true,
      qty: roundedQty,
      reasoning: [...reasoning, `Coverage only ${coverage.toFixed(0)} days, target ${targetDays} days`]
    };
  }

  return { shouldOrder: false, qty: 0, reasoning };
}

/**
 * Calculate when to order based on lead time
 */
function calculateOrderByDate(
  coverage: number,
  avgDailySales: number,
  nextPODaysAway: number | null
): Date | null {
  // Assume 30-day lead time if no PO data
  const leadTimeDays = nextPODaysAway !== null ? Math.max(nextPODaysAway, 14) : 30;

  const daysUntilStockout = coverage;
  const orderByDays = daysUntilStockout - leadTimeDays;

  if (orderByDays <= 0) {
    return new Date(); // Order NOW
  }

  const orderDate = new Date();
  orderDate.setDate(orderDate.getDate() + orderByDays);
  return orderDate;
}

/**
 * Analyze supply data and generate buying recommendations
 */
export function analyzeSupplyData(rows: PODataRow[]): ItemAnalysis[] {
  const grouped = groupByMPN(rows);
  const results: ItemAnalysis[] = [];

  for (const [mpn, itemRows] of grouped.entries()) {
    // Use first row for master data
    const masterRow = itemRows[0];

    // Calculate sales metrics
    const avgDailySales = calculateAvgDailySales(masterRow);
    const trend = calculateTrend(masterRow);
    const recentMonthSales = masterRow['Sale This Month'] + masterRow['Sale-1M'] + masterRow['Sale-2M'];
    const historicalMonthSales = masterRow['Sale-3M'] + masterRow['Sale-4M'] + masterRow['Sale-5M'];

    // Stock position
    const currentStock = masterRow['Qty on stock'];
    const pos = parseIncomingPOs(itemRows);
    const totalOutstanding = pos.reduce((sum, po) => sum + po.outstandingQty, 0);
    const effectiveStock = currentStock + totalOutstanding;
    const isStockout = currentStock <= 0;

    // Coverage
    const coverage = calculateCoverage(effectiveStock, avgDailySales);
    const nextArrival = pos.length > 0 ? pos[0] : null;
    const coverageAfterNextPO = nextArrival
      ? calculateCoverage(effectiveStock + nextArrival.outstandingQty, avgDailySales)
      : coverage;

    // SO demand
    const totalSOQty = masterRow['SO Qty'] || 0;
    const hasDemandAllocation = masterRow['Demand Allocation']?.toLowerCase() === 'yes';

    // Urgency and priority
    const urgency = determineUrgency(coverage, isStockout, hasDemandAllocation, trend.category);
    const priority = calculatePriority(urgency, masterRow['ABC Category'], coverage, isStockout);

    // Order recommendation
    const orderRec = calculateOrderRecommendation(
      currentStock,
      totalOutstanding,
      avgDailySales,
      trend.category
    );

    const reasoning = [...orderRec.reasoning];

    // Critical risk flags
    if (isStockout) reasoning.push('Currently out of stock');
    if (hasDemandAllocation) reasoning.push('Has allocated SO demand');
    if (coverage < 14) reasoning.push('Low coverage');

    // Trend analysis
    if (trend.category === 'GROWING') reasoning.push('Demand growing');
    if (trend.category === 'DECLINING') reasoning.push('Demand declining');

    // PO reliability issues
    const unknownPOs = pos.filter(po => po.status?.toLowerCase() === 'unknown');
    if (unknownPOs.length > 0) {
      reasoning.push(`${unknownPOs.length} PO(s) with unknown status`);
    }

    // High-value item warnings
    if (masterRow['ABC Category'].startsWith('A') && coverage < 30) {
      reasoning.push('High-value item needs attention');
    }

    // Demand allocation warnings
    if (hasDemandAllocation && totalSOQty > totalOutstanding) {
      reasoning.push('Allocated demand exceeds incoming');
    }

    const orderByDate = orderRec.shouldOrder
      ? calculateOrderByDate(coverage, avgDailySales, nextArrival?.daysAway || null)
      : null;

    results.push({
      mpn,
      description: masterRow.Description,
      vendor: masterRow['Vendor Name'],
      serviceClass: masterRow['Service Class'],
      abcCategory: masterRow['ABC Category'],
      currentStock,
      totalOutstanding,
      effectiveStock,
      isStockout,
      pos,
      nextArrival,
      avgDailySales,
      recentMonthSales,
      historicalMonthSales,
      trendPct: trend.trendPct,
      trendCategory: trend.category,
      totalSOQty,
      hasDemandAllocation,
      coverage,
      coverageAfterNextPO,
      priority,
      urgency,
      shouldOrder: orderRec.shouldOrder,
      recommendedOrderQty: orderRec.qty,
      orderByDate,
      reasoning
    });
  }

  // Sort by priority (highest first)
  results.sort((a, b) => b.priority - a.priority);

  return results;
}

/**
 * Generate sample data for testing - Comprehensive realistic scenarios
 */
export function generateSampleData(): string {
  return `Order no\tVendor Name\tMPN\tDescription\tService Class\tABC Category\tReceipt Date Status\tExpected Receipt Date\tOutstanding Qty\tOutstanding Amount\tQty on stock\tSale This Month\tSale-1M\tSale-2M\tSale-3M\tSale-4M\tSale-5M\tSale-6M\tSO Qty\tDemand Allocation
PO-2401\tUbiquiti (Taiwan) Sales\tUXG-MAX\tUniFi Gateway Max Router\tAA\tAA-High\tUnknown\t2025-11-20\t20\t23000\t22\t151\t122\t96\t68\t73\t132\t107\t5\tNo
PO-2402\tUbiquiti (Taiwan) Sales\tUWB-XG\tUniFi WiFi BaseStation XG\tBA\tBA-High\tConfirmed\t2025-11-18\t50\t12500\t45\t42\t38\t41\t35\t32\t30\t28\t19\tYes
PO-2403\tUbiquiti (Taiwan) Sales\tUVC-G5-TURRET-ULTRA\tUniFi G5 Turret Ultra Camera\tAA\tAA-High\tConfirmed\t2025-11-15\t6\t1800\t1279\t0\t1835\t872\t949\t840\t1535\t2574\t6\tYes
PO-2404\tUbiquiti (Taiwan) Sales\tLTU-LITE\tLiteBeam 5AC Gen2\tCA\tCA-Medium\tUnknown\t2025-11-25\t50\t2500\t125\t0\t0\t0\t0\t43\t35\t28\t0\tNo
PO-2405\tUbiquiti (Taiwan) Sales\tUDM-PRO\tUniFi Dream Machine Pro\tBA\tBA-High\tConfirmed\t2025-11-12\t100\t35000\t45\t85\t92\t88\t75\t68\t72\t80\t25\tNo
PO-2406\tUbiquiti (Taiwan) Sales\tUSW-PRO-24-POE\tUniFi Switch Pro 24 PoE\tAA\tAA-High\tUnknown\t2025-11-22\t25\t8750\t18\t62\t58\t55\t48\t52\t60\t65\t10\tNo
PO-2407\tUbiquiti (Taiwan) Sales\tU6-ENTERPRISE\tUniFi 6 Enterprise AP\tBA\tBA-High\tConfirmed\t2025-11-16\t80\t24000\t95\t48\t52\t45\t42\t38\t35\t40\t0\tNo
PO-2408\tUbiquiti (Taiwan) Sales\tUCK-G2-PLUS\tUniFi Cloud Key Gen2 Plus\tCB\tCB-Medium\tPending\t2025-12-01\t150\t15000\t220\t35\t32\t28\t30\t25\t22\t20\t5\tNo
PO-2409\tUbiquiti (Taiwan) Sales\tUA-PRO\tUniFi Access Pro Reader\tDD\tDD-Low\tConfirmed\t2025-11-28\t200\t4000\t580\t12\t15\t14\t10\t11\t13\t12\t0\tNo
PO-2410\tUbiquiti (Taiwan) Sales\tNANO-BEAM-5AC-G2\tNanoBeam 5AC Gen2\tCA\tCA-Medium\tUnknown\t2025-12-05\t75\t5625\t35\t28\t32\t35\t42\t45\t48\t52\t8\tNo
PO-2411\tUbiquiti (Taiwan) Sales\tUSW-FLEX-MINI\tUniFi Switch Flex Mini\tDB\tDB-Low\tConfirmed\t2025-11-20\t300\t9000\t450\t22\t25\t20\t18\t16\t15\t14\t0\tNo
PO-2412\tUbiquiti (Taiwan) Sales\tUVC-G4-DOORBELL-PRO\tUniFi G4 Doorbell Pro\tBA\tBA-High\tPending\t2025-11-14\t50\t12500\t12\t55\t62\t58\t52\t48\t45\t42\t15\tYes
PO-2413\tUbiquiti (Taiwan) Sales\tUDR\tUniFi Dream Router\tCB\tCB-Medium\tConfirmed\t2025-11-18\t120\t18000\t185\t38\t42\t35\t32\t28\t25\t30\t0\tNo
PO-2414\tUbiquiti (Taiwan) Sales\tUXG-MAX\tUniFi Gateway Max Router\tAA\tAA-High\tUnknown\t2025-12-10\t15\t17250\t22\t151\t122\t96\t68\t73\t132\t107\t5\tNo
PO-2415\tUbiquiti (Taiwan) Sales\tU6-LITE\tUniFi 6 Lite AP\tCA\tCA-Medium\tConfirmed\t2025-11-19\t200\t20000\t125\t45\t48\t42\t38\t35\t32\t30\t0\tNo
PO-2416\tUbiquiti (Taiwan) Sales\tUSP-PDU-PRO\tUniFi SmartPower PDU Pro\tBA\tBA-High\tPending\t2025-11-30\t40\t16000\t8\t18\t22\t25\t28\t32\t35\t38\t5\tNo
PO-2417\tUbiquiti (Taiwan) Sales\tUVC-G4-BULLET\tUniFi G4 Bullet Camera\tCB\tCB-Medium\tConfirmed\t2025-11-17\t100\t15000\t165\t32\t35\t30\t28\t25\t22\t20\t0\tNo
PO-2418\tUbiquiti (Taiwan) Sales\tUA-HUB\tUniFi Access Hub\tDB\tDB-Low\tUnknown\t2025-12-08\t80\t4800\t150\t8\t10\t12\t15\t18\t20\t22\t0\tNo
PO-2419\tUbiquiti (Taiwan) Sales\tAIR-CUBE-ISP\tairCube ISP AP\tDD\tDD-Low\tConfirmed\t2025-11-25\t150\t2250\t380\t5\t6\t8\t10\t12\t15\t18\t0\tNo
PO-2420\tUbiquiti (Taiwan) Sales\tUVC-AI-BULLET\tUniFi AI Bullet Camera\tAA\tAA-High\tPending\t2025-11-13\t30\t12000\t5\t42\t45\t48\t52\t58\t62\t68\t12\tYes`;
}
