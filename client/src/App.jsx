import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SidebarLayout from './components/SidebarLayout';
import ScanParcels from './pages/ScanParcels';
import ManifestScanTracker from './pages/ManifestScanTracker';
import Upload from './pages/ManifestUpload';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SidebarLayout />}>
          <Route path="upload" element={<Upload />} />
          <Route path="scan" element={<ScanParcels />} />
          <Route path="manifestscan" element={<ManifestScanTracker />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
