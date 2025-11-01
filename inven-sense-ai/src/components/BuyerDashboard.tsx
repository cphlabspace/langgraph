import React, { useState, useMemo } from 'react';
import { ItemAnalysis } from '@/services/supplyAnalyzer';
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Package,
  Calendar,
  Filter,
  Search,
  Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface BuyerDashboardProps {
  items: ItemAnalysis[];
}

export function BuyerDashboard({ items }: BuyerDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('ALL');
  const [abcFilter, setAbcFilter] = useState<string>('ALL');
  const [selectedItem, setSelectedItem] = useState<ItemAnalysis | null>(null);

  // Summary stats
  const stats = useMemo(() => {
    return {
      total: items.length,
      critical: items.filter(i => i.urgency === 'CRITICAL').length,
      high: items.filter(i => i.urgency === 'HIGH').length,
      stockouts: items.filter(i => i.isStockout).length,
      needsOrdering: items.filter(i => i.shouldOrder).length,
      totalOrderValue: items
        .filter(i => i.shouldOrder)
        .reduce((sum, i) => sum + (i.recommendedOrderQty * (i.pos[0]?.outstandingAmount / i.pos[0]?.outstandingQty || 0)), 0)
    };
  }, [items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch =
        item.mpn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesUrgency = urgencyFilter === 'ALL' || item.urgency === urgencyFilter;
      const matchesABC = abcFilter === 'ALL' || item.abcCategory.startsWith(abcFilter);

      return matchesSearch && matchesUrgency && matchesABC;
    });
  }, [items, searchTerm, urgencyFilter, abcFilter]);

  const urgencyColors = {
    CRITICAL: 'bg-red-100 border-red-500 text-red-800',
    HIGH: 'bg-orange-100 border-orange-500 text-orange-800',
    MEDIUM: 'bg-yellow-100 border-yellow-500 text-yellow-800',
    LOW: 'bg-green-100 border-green-500 text-green-800'
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl shadow-lg p-8">
          <h1 className="text-4xl font-bold mb-2">📊 Buyer's Dashboard</h1>
          <p className="text-blue-100 text-lg">
            Smart supply planning • Focus on what matters • Make confident decisions
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-gray-600">Total Items</div>
              <div className="text-3xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="bg-red-50 border-l-4 border-red-500">
            <CardContent className="pt-6">
              <div className="text-sm text-red-700 font-semibold">Critical</div>
              <div className="text-3xl font-bold text-red-700">{stats.critical}</div>
            </CardContent>
          </Card>

          <Card className="bg-orange-50 border-l-4 border-orange-500">
            <CardContent className="pt-6">
              <div className="text-sm text-orange-700 font-semibold">High Priority</div>
              <div className="text-3xl font-bold text-orange-700">{stats.high}</div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-l-4 border-purple-500">
            <CardContent className="pt-6">
              <div className="text-sm text-purple-700 font-semibold">Stockouts</div>
              <div className="text-3xl font-bold text-purple-700">{stats.stockouts}</div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-l-4 border-blue-500">
            <CardContent className="pt-6">
              <div className="text-sm text-blue-700 font-semibold">Need Orders</div>
              <div className="text-3xl font-bold text-blue-700">{stats.needsOrdering}</div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-l-4 border-green-500">
            <CardContent className="pt-6">
              <div className="text-sm text-green-700 font-semibold">Order Value</div>
              <div className="text-2xl font-bold text-green-700">
                €{(stats.totalOrderValue / 1000).toFixed(0)}K
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[300px]">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by MPN or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Urgency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Urgencies</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={abcFilter} onValueChange={setAbcFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="ABC Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  <SelectItem value="A">A Items (High Value)</SelectItem>
                  <SelectItem value="B">B Items (Medium)</SelectItem>
                  <SelectItem value="C">C Items (Low)</SelectItem>
                  <SelectItem value="D">D Items (Very Low)</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Items List */}
        <div className="space-y-3">
          {filteredItems.map((item, idx) => (
            <ItemCard
              key={item.mpn}
              item={item}
              rank={idx + 1}
              onClick={() => setSelectedItem(item)}
            />
          ))}

          {filteredItems.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                No items match your filters
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Item Card Component
function ItemCard({ item, rank, onClick }: { item: ItemAnalysis; rank: number; onClick: () => void }) {
  const urgencyColors = {
    CRITICAL: 'bg-red-100 border-red-500 text-red-800',
    HIGH: 'bg-orange-100 border-orange-500 text-orange-800',
    MEDIUM: 'bg-yellow-100 border-yellow-500 text-yellow-800',
    LOW: 'bg-green-100 border-green-500 text-green-800'
  };

  const TrendIcon = item.trendCategory === 'GROWING' ? TrendingUp :
                    item.trendCategory === 'DECLINING' ? TrendingDown : Minus;

  const trendColor = item.trendCategory === 'GROWING' ? 'text-green-600' :
                     item.trendCategory === 'DECLINING' ? 'text-red-600' : 'text-gray-600';

  return (
    <Card
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="py-4">
        <div className="flex items-start gap-4">

          {/* Rank Badge */}
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-lg font-bold text-blue-700">#{rank}</span>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 truncate">
                  {item.description}
                </h3>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                  <span><strong>MPN:</strong> {item.mpn}</span>
                  <span><strong>Vendor:</strong> {item.vendor}</span>
                  <Badge variant="outline" className="ml-2">{item.abcCategory}</Badge>
                  <Badge variant="secondary">{item.serviceClass}</Badge>
                </div>
              </div>

              <div className={`px-4 py-2 border-2 rounded-lg ${urgencyColors[item.urgency]} text-center`}>
                <div className="text-xs font-medium">Priority</div>
                <div className="text-2xl font-bold">{item.priority}</div>
                <div className="text-xs mt-1">{item.urgency}</div>
              </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-6 gap-4 mt-4">
              <div className="bg-gray-50 rounded p-2">
                <div className="text-xs text-gray-600">Daily Demand</div>
                <div className="text-lg font-bold">{item.avgDailySales.toFixed(1)}</div>
                <div className={`text-xs ${trendColor} flex items-center gap-1 mt-1`}>
                  <TrendIcon className="w-3 h-3" />
                  {item.trendPct > 0 ? '+' : ''}{item.trendPct.toFixed(0)}%
                </div>
              </div>

              <div className="bg-gray-50 rounded p-2">
                <div className="text-xs text-gray-600">Stock</div>
                <div className={`text-lg font-bold ${item.isStockout ? 'text-red-600' : ''}`}>
                  {item.currentStock.toLocaleString()}
                </div>
                {item.isStockout && (
                  <div className="text-xs text-red-600 font-semibold mt-1">STOCKOUT</div>
                )}
              </div>

              <div className="bg-gray-50 rounded p-2">
                <div className="text-xs text-gray-600">Incoming</div>
                <div className="text-lg font-bold">{item.totalOutstanding.toLocaleString()}</div>
                <div className="text-xs text-gray-500 mt-1">{item.pos.length} POs</div>
              </div>

              <div className="bg-gray-50 rounded p-2">
                <div className="text-xs text-gray-600">Coverage</div>
                <div className={`text-lg font-bold ${item.coverage < 30 ? 'text-orange-600' : ''}`}>
                  {item.coverage.toFixed(0)}d
                </div>
                {item.nextArrival && (
                  <div className="text-xs text-gray-500 mt-1">
                    Next: {item.nextArrival.daysAway}d
                  </div>
                )}
              </div>

              <div className="bg-gray-50 rounded p-2">
                <div className="text-xs text-gray-600">Effective</div>
                <div className="text-lg font-bold">{item.effectiveStock.toLocaleString()}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Stock + POs
                </div>
              </div>

              <div className="bg-gray-50 rounded p-2">
                <div className="text-xs text-gray-600">SO Demand</div>
                <div className="text-lg font-bold">{item.totalSOQty}</div>
                {item.hasDemandAllocation && (
                  <div className="text-xs text-blue-600 font-semibold mt-1">Allocated</div>
                )}
              </div>
            </div>

            {/* Action Required */}
            {item.shouldOrder && (
              <div className="mt-4 bg-blue-50 border-2 border-blue-500 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-blue-900">
                      <Package className="inline w-4 h-4 mr-1" />
                      Recommendation: ORDER NOW
                    </div>
                    <div className="text-lg font-bold text-blue-700 mt-1">
                      {item.recommendedOrderQty.toLocaleString()} units
                    </div>
                  </div>
                  {item.orderByDate && (
                    <div className="text-right">
                      <div className="text-xs text-blue-700">Order by</div>
                      <div className="text-sm font-bold text-blue-900">
                        <Calendar className="inline w-4 h-4 mr-1" />
                        {item.orderByDate.toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short'
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Risk Flags */}
            {item.reasoning.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {item.reasoning.slice(0, 3).map((reason, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {reason}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
