// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './pages/AuthContext';
import SidebarLayout from './components/SidebarLayout';
import ScanParcels from './pages/ScanParcels';
import ManifestScanTracker from './pages/ManifestScanTracker';
import Upload from './pages/ManifestUpload';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './pages/ProtectedRoute';
import MobileScanParcels from './pages/MobileScanParcels';


const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Login route (unprotected) */}
          <Route path="/loginwarehouse" element={<LoginPage />} />

          {/* Main app routes (protected) */}
          <Route element={
            <ProtectedRoute>
              <SidebarLayout />
            </ProtectedRoute>
          }>
            <Route path="/upload" element={<Upload />} />
            <Route path="/scan" element={<ScanParcels />} />
            <Route path="/manifestscan" element={<ManifestScanTracker />} />
          </Route>

          <Route path="/mobilescan" element={<MobileScanParcels />} />

          {/* Redirect root to /upload */}
          <Route path="/" element={<Navigate to="/upload" replace />} />
          
          {/* Catch-all route redirects to /upload */}
          <Route path="*" element={<Navigate to="/upload" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;