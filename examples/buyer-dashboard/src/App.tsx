import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { UploadPage } from '@/components/UploadPage';
import { BuyerDashboard } from '@/components/BuyerDashboard';
import { ItemAnalysis } from '@/services/supplyAnalyzer';

function DashboardRoute() {
  const location = useLocation();
  const items = (location.state as { items: ItemAnalysis[] })?.items || [];

  if (items.length === 0) {
    // Redirect to upload if no data
    window.location.href = '/';
    return null;
  }

  return <BuyerDashboard items={items} />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<UploadPage />} />
        <Route path="/dashboard" element={<DashboardRoute />} />
      </Routes>
    </Router>
  );
}

export default App;
