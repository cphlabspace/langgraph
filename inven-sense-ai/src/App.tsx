import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UploadPage } from './components/UploadPage';
import { BuyerDashboard } from './components/BuyerDashboard';
import { ItemAnalysis } from './services/supplyAnalyzer';

function App() {
  const [analyzedItems, setAnalyzedItems] = useState<ItemAnalysis[]>([]);

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={<UploadPage onDataAnalyzed={setAnalyzedItems} />}
        />
        <Route
          path="/dashboard"
          element={
            analyzedItems.length > 0 ? (
              <BuyerDashboard items={analyzedItems} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
