// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './pages/AuthContext';
import SidebarLayout from './components/SidebarLayout';
import ScanParcels from './pages/ScanParcels';
import ManifestScanTracker from './pages/ManifestScanTracker';
import Upload from './pages/ManifestUpload';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './pages/ProtectedRoute';

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={
            <ProtectedRoute>
              <SidebarLayout />
            </ProtectedRoute>
          }>
            <Route path="upload" element={<Upload />} />
            <Route path="scan" element={<ScanParcels />} />
            <Route path="manifestscan" element={<ManifestScanTracker />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;