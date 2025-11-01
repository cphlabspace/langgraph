import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { parsePOData, analyzeSupplyData, generateSampleData, ItemAnalysis } from '@/services/supplyAnalyzer';

interface UploadPageProps {
  onDataAnalyzed: (items: ItemAnalysis[]) => void;
}

export function UploadPage({ onDataAnalyzed }: UploadPageProps) {
  const [poData, setPoData] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  const handleLoadSample = () => {
    const sampleData = generateSampleData();
    setPoData(sampleData);
    setError(null);
  };

  const handleAnalyze = () => {
    try {
      setIsProcessing(true);
      setError(null);

      // Parse the PO data
      const rows = parsePOData(poData);

      if (rows.length === 0) {
        throw new Error('No valid data rows found. Please check your input format.');
      }

      // Analyze the data
      const analysis = analyzeSupplyData(rows);

      if (analysis.length === 0) {
        throw new Error('Analysis produced no results. Please check your data.');
      }

      // Pass results up and navigate to dashboard
      onDataAnalyzed(analysis);
      navigate('/dashboard');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while processing the data');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full">
            <FileSpreadsheet className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">
            InvenSense AI
          </h1>
          <p className="text-xl text-gray-600">
            Smart Purchase Order Analysis for Buyers
          </p>
        </div>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Use</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Export your PO data from your ERP system as tab-separated values</li>
              <li>Paste the data into the text area below (including the header row)</li>
              <li>Click "Analyze" to get intelligent buying recommendations</li>
            </ol>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Required Columns:</h4>
              <p className="text-sm text-blue-800">
                Order no, Vendor Name, MPN, Description, Service Class, ABC Category,
                Receipt Date Status, Expected Receipt Date, Outstanding Qty, Outstanding Amount,
                Qty on stock, Sale This Month, Sale-1M through Sale-6M, SO Qty, Demand Allocation
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Upload Area */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload PO Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <textarea
                className="w-full h-64 p-4 border border-gray-300 rounded-lg font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Paste your tab-separated PO data here...&#10;&#10;Order no	Vendor Name	MPN	Description	Service Class	ABC Category..."
                value={poData}
                onChange={(e) => {
                  setPoData(e.target.value);
                  setError(null);
                }}
              />
              <div className="text-sm text-gray-500 mt-2">
                {poData ? `${poData.split('\n').length} lines` : 'No data entered'}
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-900">Error</h4>
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleLoadSample}
                variant="outline"
                className="flex-1"
              >
                Load Sample Data
              </Button>
              <Button
                onClick={handleAnalyze}
                disabled={!poData || isProcessing}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Analyze Data
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl mb-2">🎯</div>
              <h3 className="font-semibold mb-1">Smart Prioritization</h3>
              <p className="text-sm text-gray-600">
                AI-powered urgency scoring based on stock levels, demand trends, and ABC category
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl mb-2">📈</div>
              <h3 className="font-semibold mb-1">Trend Analysis</h3>
              <p className="text-sm text-gray-600">
                Detects growing/declining demand patterns from 7 months of sales history
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl mb-2">💡</div>
              <h3 className="font-semibold mb-1">Order Recommendations</h3>
              <p className="text-sm text-gray-600">
                Calculates optimal order quantities and timing to maintain healthy stock levels
              </p>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
