import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyzeSupplyData, generateSampleData } from '@/services/supplyAnalyzer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, Sparkles } from 'lucide-react';

export function UploadPage() {
  const navigate = useNavigate();
  const [poData, setPoData] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = () => {
    if (!poData.trim()) {
      setError('Please paste PO data or load sample data');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const analysis = analyzeSupplyData(poData);

      if (analysis.length === 0) {
        setError('No items found in the data. Please check the format.');
        setIsProcessing(false);
        return;
      }

      // Navigate to dashboard with results
      navigate('/dashboard', { state: { items: analysis } });
    } catch (err) {
      setError(`Error analyzing data: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsProcessing(false);
    }
  };

  const handleLoadSample = () => {
    setPoData(generateSampleData());
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full mb-6">
            <FileSpreadsheet className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Supply Chain Intelligence
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Transform your PO data export into actionable insights with AI-powered demand forecasting,
            trend analysis, and smart ordering recommendations
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-2 border-blue-200">
            <CardContent className="pt-6 text-center">
              <div className="text-4xl mb-3">📊</div>
              <h3 className="font-bold text-lg mb-2">7-Month Demand Analysis</h3>
              <p className="text-sm text-gray-600">
                Historical trends, seasonality patterns, and growth forecasting
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200">
            <CardContent className="pt-6 text-center">
              <div className="text-4xl mb-3">🎯</div>
              <h3 className="font-bold text-lg mb-2">Smart Prioritization</h3>
              <p className="text-sm text-gray-600">
                ABC category weighting and urgency-based action planning
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200">
            <CardContent className="pt-6 text-center">
              <div className="text-4xl mb-3">🚀</div>
              <h3 className="font-bold text-lg mb-2">Automated Recommendations</h3>
              <p className="text-sm text-gray-600">
                Order quantities, timing, and coverage optimization
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Upload Card */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Upload className="w-6 h-6" />
              Upload PO Data Export
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Paste tab-separated data with columns: Order no, Vendor Name, MPN, Description,
              Service Class, ABC Category, Expected Receipt Date, Outstanding Qty, Qty on stock,
              Sale This Month, Sale-1M through Sale-6M, etc.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <textarea
                value={poData}
                onChange={(e) => {
                  setPoData(e.target.value);
                  setError(null);
                }}
                placeholder="Paste your tab-separated PO data here..."
                className="w-full h-64 p-4 border-2 border-gray-300 rounded-lg font-mono text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 text-red-800">
                <strong>Error:</strong> {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handleAnalyze}
                disabled={isProcessing}
                className="flex-1 h-12 text-lg"
              >
                {isProcessing ? (
                  <>Processing...</>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Analyze Supply Data
                  </>
                )}
              </Button>

              <Button
                onClick={handleLoadSample}
                variant="outline"
                className="h-12"
              >
                <FileSpreadsheet className="w-5 h-5 mr-2" />
                Load Sample Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Expected Data Format</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 rounded-lg p-4 font-mono text-xs overflow-x-auto">
              <div className="whitespace-pre">
{`Order no\tVendor Name\tMPN\tDescription\tService Class\tABC Category\t...
PO-12345\tACME Corp\tWIDGET-100\tHigh Performance Widget\tA\tA1\t...
PO-12346\tTechSupply\tGADGET-200\tStandard Gadget\tB\tB2\t...`}
              </div>
            </div>
            <div className="mt-4 space-y-2 text-sm text-gray-600">
              <p><strong>Required columns:</strong> Order no, Vendor Name, MPN, Description, Outstanding Qty, Qty on stock, Sale This Month, Sale-1M through Sale-6M</p>
              <p><strong>Optional columns:</strong> Service Class, ABC Category, Expected Receipt Date, Outstanding Amount, Total SO Qty, SO Lines</p>
              <p><strong>Format:</strong> Tab-separated values (TSV) - typically exported from Excel or ERP systems</p>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
