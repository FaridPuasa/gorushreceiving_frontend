import React, { useEffect, useState, useRef } from 'react';
import { Pause, Play, Package, CheckCircle, AlertCircle, Wifi, WifiOff, User, RefreshCw, AlertTriangle, X } from 'lucide-react';

const ScanParcels = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [recentScans, setRecentScans] = useState([]);
  const [customerStats, setCustomerStats] = useState([]);
  const [userId] = useState(`scanner_${Math.random().toString(36).substr(2, 9)}`);
  const [userName, setUserName] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingScans, setPendingScans] = useState([]);
  const [scanCount, setScanCount] = useState(0);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [scanInput, setScanInput] = useState('');
  const [showMultiParcelWarning, setShowMultiParcelWarning] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [customerParcelCount, setCustomerParcelCount] = useState(0);
  const [pendingScanData, setPendingScanData] = useState(null);
  const [manifests, setManifests] = useState([]);
  const [selectedManifest, setSelectedManifest] = useState('');
  const [manifestDetails, setManifestDetails] = useState(null);
  const [viewMode, setViewMode] = useState('scan');
  
  const inputRef = useRef(null);
  const scanBuffer = useRef('');
  const scanTimeout = useRef(null);

  useEffect(() => {
  if (selectedManifest) {
    fetchCustomerStats(selectedManifest);
  }
}, [selectedManifest]);

useEffect(() => {
  if (!selectedManifest) {
    setCustomerStats([]); // Clear stats when no manifest selected
    return;
  }

  

  const fetchCustomerStats = async () => {
    setIsLoadingStats(true);
    try {
      const res = await fetch(`https://grscanningsystemserver.onrender.com/api/stats/customers?manifest=${encodeURIComponent(selectedManifest)}`);
      const data = await res.json();
      if (data.success) {
        setCustomerStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch customer stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  fetchCustomerStats();
}, [selectedManifest]);



  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      processPendingScans();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

 const isMultiParcelCustomer = (trackingNumber) => {
  const customerName = extractCustomerName(trackingNumber);
  if (!customerName) return false;
  
  const customerStat = customerStats.find(stat => stat._id === customerName);
  return customerStat && customerStat.parcelCount > 1;
};
const sortedManifests = [...manifests].sort((a, b) => new Date(b.date) - new Date(a.date));


useEffect(() => {
  const loadManifests = async () => {
    try {
      const res = await fetch('https://grscanningsystemserver.onrender.com/api/manifests/scan-stats');
      const data = await res.json();
      if (data.success) {
        // Sort manifests by date (newest first)
        const sortedManifests = [...data.manifests].sort((a, b) => 
          new Date(b.date) - new Date(a.date)
        );
        
        setManifests(sortedManifests);
        
        // Automatically select the first manifest if available
        if (sortedManifests.length > 0) {
          setSelectedManifest(sortedManifests[0].manifestNumber);
        }
      }
    } catch (error) {
      console.error('Failed to load manifests:', error);
    }
  };

  loadManifests();
}, []);

  // Handle barcode scanner input
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!isScanning) return;

      if (e.key === 'Enter') {
        if (scanBuffer.current.length > 0) {
          handleAutoScan(scanBuffer.current.trim());
          scanBuffer.current = '';
        }
        e.preventDefault();
        return;
      }

      if (e.key.length === 1) {
        scanBuffer.current += e.key;
        
        if (scanTimeout.current) {
          clearTimeout(scanTimeout.current);
        }
        
        scanTimeout.current = setTimeout(() => {
          if (scanBuffer.current.length > 0) {
            handleAutoScan(scanBuffer.current.trim());
            scanBuffer.current = '';
          }
        }, 100);
      }
    };

    if (isScanning) {
      document.addEventListener('keypress', handleKeyPress);
      inputRef.current?.focus();
    }

    return () => {
      document.removeEventListener('keypress', handleKeyPress);
      if (scanTimeout.current) {
        clearTimeout(scanTimeout.current);
      }
    };
  }, [isScanning]);

  // Load initial data
  useEffect(() => {
    fetchCustomerStats();
    loadUserName();
  }, []);

  const loadUserName = () => {
    const saved = localStorage.getItem('scannerUserName');
    if (saved) {
      setUserName(saved);
    }
  };

  const saveUserName = (name) => {
    setUserName(name);
    localStorage.setItem('scannerUserName', name);
  };



  useEffect(() => {
    if (!selectedManifest) {
      setCustomerStats([]);
      return;
    }

    fetchCustomerStats(selectedManifest);
  }, [selectedManifest]);

const fetchCustomerStats = async (manifestNumber = null) => {
  setIsLoadingStats(true);
  
  try {
    // Don't fetch if no manifest is selected
    if (!manifestNumber && !selectedManifest) {
      setCustomerStats([]);
      return;
    }

    const manifestToFetch = manifestNumber || selectedManifest;
    const res = await fetch(`https://grscanningsystemserver.onrender.com/api/stats/customers?manifest=${encodeURIComponent(manifestToFetch)}`);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    
    if (data.success && Array.isArray(data.stats)) {
      setCustomerStats(data.stats);
    } else {
      setCustomerStats([]);
    }
  } catch (error) {
    console.error('Failed to fetch customer stats:', error);
    setCustomerStats([]);
  } finally {
    setIsLoadingStats(false);
  }
};

  const processPendingScans = async () => {
    if (pendingScans.length === 0) return;

    const scansToProcess = [...pendingScans];
    setPendingScans([]);

    for (const scan of scansToProcess) {
      try {
        await submitScan(scan.trackingNumber, scan.timestamp);
        updateRecentScan(scan.id, { status: 'success', message: 'Synced successfully' });
      } catch (error) {
        setPendingScans(prev => [...prev, scan]);
        updateRecentScan(scan.id, { status: 'error', message: 'Sync failed' });
      }
    }
  };

const submitScan = async (trackingNumber, timestamp) => {
  const response = await fetch('https://grscanningsystemserver.onrender.com/api/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      trackingNumber,
      userId,
      userName,
      timestamp,
      manifestNumber: selectedManifest // Add this line
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Scan failed');
  }

  return response.json();
};

const extractCustomerName = (trackingNumber) => {
  // Find the customer by looking for the tracking number in their tracking numbers array
  const customer = customerStats.find(stat => {
    // Check if this tracking number belongs to this customer
    return stat.trackingNumbers && stat.trackingNumbers.includes(trackingNumber);
  });
  
  return customer ? customer._id : null; // _id contains the customer name
};

const handleAutoScan = async (scannedNumber) => {
  if (!scannedNumber || scannedNumber.length < 3) return;

  const scanData = {
      scannedNumber,
      timestamp: new Date().toISOString(),
      scanId: Date.now(),
      manifestNumber: selectedManifest
    };

  const customerName = extractCustomerName(scannedNumber);
  if (!customerName) {
    // If customer not found, proceed with normal scan
    processScan(scannedNumber, new Date().toISOString(), Date.now());
    return;
  }

  const customerStat = customerStats.find(stat => stat._id === customerName);
  
  if (customerStat && customerStat.parcelCount > 1) {
    // Show warning and pause processing
    setCurrentCustomer(customerName); // Now using the actual customer name
    setCustomerParcelCount(customerStat.parcelCount);
    setPendingScanData({
      scannedNumber,
      timestamp: new Date().toISOString(),
      scanId: Date.now()
    });
    setShowMultiParcelWarning(true);
    return;
  }

  // Proceed with normal scan if no warning needed
  processScan(scannedNumber, new Date().toISOString(), Date.now());
};

  const processScan = async (scannedNumber, timestamp, scanId) => {
    const newScan = {
      id: scanId,
      trackingNumber: scannedNumber,
      timestamp,
      status: 'processing',
      message: 'Processing...',
      user: userName || userId
    };

    setRecentScans(prev => [newScan, ...prev.slice(0, 19)]);
    setScanCount(prev => prev + 1);

    try {
      if (isOnline) {
        const result = await submitScan(scannedNumber, timestamp);
        updateRecentScan(scanId, { 
          status: 'success', 
          message: result.message || 'Scan successful' 
        });
        fetchCustomerStats();
      } else {
        setPendingScans(prev => [...prev, { id: scanId, trackingNumber: scannedNumber, timestamp }]);
        updateRecentScan(scanId, { 
          status: 'pending', 
          message: 'Queued for sync' 
        });
      }
    } catch (error) {
      updateRecentScan(scanId, { 
        status: 'error', 
        message: error.message 
      });
    }
  };

  const confirmMultiParcelScan = () => {
    if (pendingScanData) {
      processScan(
        pendingScanData.scannedNumber,
        pendingScanData.timestamp,
        pendingScanData.scanId
      );
    }
    setShowMultiParcelWarning(false);
    setPendingScanData(null);
  };

  const cancelMultiParcelScan = () => {
    setShowMultiParcelWarning(false);
    setPendingScanData(null);
    // Clear the scan buffer if needed
    scanBuffer.current = '';
    setScanInput('');
    if (isScanning) {
      inputRef.current?.focus();
    }
  };

  const updateRecentScan = (scanId, updates) => {
    setRecentScans(prev => prev.map(scan => 
      scan.id === scanId ? { ...scan, ...updates } : scan
    ));
  };

  const toggleScanning = () => {
    setIsScanning(!isScanning);
    if (!isScanning) {
      scanBuffer.current = '';
      inputRef.current?.focus();
    }
  };

  const handleScanInputChange = (e) => {
    setScanInput(e.target.value);
  };

  const handleScanInputKeyDown = (e) => {
    if (e.key === 'Enter' && scanInput.trim().length >= 3) {
      e.preventDefault();
      handleAutoScan(scanInput.trim());
      setScanInput('');
    }
  };

  const getStatusIcon = (status) => {
    const iconStyle = { width: '16px', height: '16px' };
    switch (status) {
      case 'success': return <CheckCircle style={{ ...iconStyle, color: '#10B981' }} />;
      case 'error': return <AlertCircle style={{ ...iconStyle, color: '#EF4444' }} />;
      case 'pending': return <Package style={{ ...iconStyle, color: '#F59E0B' }} />;
      default: return <div style={{ ...iconStyle, backgroundColor: '#D1D5DB', borderRadius: '9999px', animation: 'pulse 2s infinite' }} />;
    }
  };

const getStatusColor = (status, trackingNumber) => {
  // Check if this is a multi-parcel customer first
  const isMultiParcel = trackingNumber && isMultiParcelCustomer(trackingNumber);
  
  if (isMultiParcel && status === 'success') {
    return { 
      backgroundColor: '#F5F3FF', 
      borderColor: '#DDD6FE', 
      color: '#5B21B6' 
    };
  }

  switch (status) {
    case 'success': return { backgroundColor: '#ECFDF5', borderColor: '#D1FAE5', color: '#065F46' };
    case 'error': return { backgroundColor: '#FEF2F2', borderColor: '#FECACA', color: '#991B1B' };
    case 'pending': return { backgroundColor: '#FFFBEB', borderColor: '#FDE68A', color: '#92400E' };
    default: return { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB', color: '#1F2937' };
  }
};

  const containerStyle = {
    minHeight: '100vh',
    backgroundColor: '#F9FAFB',
    padding: '16px'
  };

  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    padding: '24px',
    marginBottom: '24px'
  };

  const buttonStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 16px',
    borderRadius: '8px',
    fontWeight: '500',
    transition: 'all 0.2s',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    border: 'none'
  };

  const scanButtonStyle = {
    ...buttonStyle,
    backgroundColor: isScanning ? '#DC2626' : '#2563EB',
    color: 'white'
  };

    const ManifestDetailsView = () => {
    if (!manifestDetails) return null;

    return (
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <button 
            onClick={() => setViewMode('scan')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              backgroundColor: '#E5E7EB',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
            <span>Back</span>
          </button>
          <h2 style={{ fontSize: '20px', fontWeight: '600' }}>
            {manifestDetails.manifestNumber}
          </h2>
          <div style={{ 
            backgroundColor: '#EFF6FF',
            color: '#1E40AF',
            padding: '4px 8px',
            borderRadius: '9999px',
            fontSize: '14px'
          }}>
            {manifestDetails.date ? new Date(manifestDetails.date).toLocaleDateString() : 'No date'}
          </div>
        </div>

        <div style={{ 
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={cardStyle}>
            <h3 style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>Total Parcels</h3>
            <p style={{ fontSize: '24px', fontWeight: '600' }}>{manifestDetails.totalParcels}</p>
          </div>
          <div style={cardStyle}>
            <h3 style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>Received</h3>
            <p style={{ fontSize: '24px', fontWeight: '600', color: '#10B981' }}>
              {manifestDetails.receivedParcels}
            </p>
          </div>
          <div style={cardStyle}>
            <h3 style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>Completion</h3>
            <p style={{ fontSize: '24px', fontWeight: '600' }}>
              {Math.round((manifestDetails.receivedParcels / manifestDetails.totalParcels) * 100)}%
            </p>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Scan Activity</h3>
          <div style={{ 
            maxHeight: '300px',
            overflowY: 'auto',
            border: '1px solid #E5E7EB',
            borderRadius: '8px'
          }}>
            {manifestDetails.scanActivity.map((scan, index) => (
              <div key={index} style={{ 
                padding: '12px 16px',
                borderBottom: '1px solid #E5E7EB',
                backgroundColor: scan.received ? '#ECFDF5' : 'white'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontWeight: '500' }}>{scan.trackingNumber}</p>
                    <p style={{ fontSize: '12px', color: '#6B7280' }}>
                      {scan.consigneeName}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '12px' }}>
                      {new Date(scan.timestamp).toLocaleTimeString()}
                    </p>
                    <p style={{ fontSize: '12px', color: '#6B7280' }}>
                      {scan.user}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>All Parcels</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px' }}>Tracking #</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px' }}>Consignee</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px' }}>Scanned By</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px' }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {manifestDetails.parcels.map((parcel, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <td style={{ padding: '12px' }}>{parcel.trackingNumber}</td>
                    <td style={{ padding: '12px' }}>{parcel.consigneeName}</td>
                    <td style={{ padding: '12px' }}>
                      {parcel.received ? (
                        <span style={{ 
                          backgroundColor: '#ECFDF5',
                          color: '#065F46',
                          padding: '4px 8px',
                          borderRadius: '9999px',
                          fontSize: '12px'
                        }}>
                          Received
                        </span>
                      ) : (
                        <span style={{ 
                          backgroundColor: '#FEF2F2',
                          color: '#92400E',
                          padding: '4px 8px',
                          borderRadius: '9999px',
                          fontSize: '12px'
                        }}>
                          Pending
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>{parcel.receivedBy || '-'}</td>
                    <td style={{ padding: '12px' }}>
                      {parcel.receivedAt ? new Date(parcel.receivedAt).toLocaleTimeString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };


  return (
    <div style={containerStyle}>
      {/* Multi-Parcel Warning Popup */}
      {showMultiParcelWarning && (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#92400E',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertTriangle style={{ color: '#D97706' }} />
                Multiple Parcels Warning
              </h3>
              <button 
                onClick={cancelMultiParcelScan}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6B7280'
                }}
              >
                <X size={24} />
              </button>
            </div>
            
            <p style={{ marginBottom: '16px', lineHeight: '1.5', fontSize: '16px' }}>
              Customer <strong style={{ color: '#1E40AF' }}>{currentCustomer}</strong> has{' '}
              <strong style={{ color: '#B45309' }}>{customerParcelCount} parcels</strong> in the system.
            </p>
            
            <p style={{ marginBottom: '24px', lineHeight: '1.5', fontSize: '14px', color: '#4B5563' }}>
              Please verify you're scanning the correct parcel for this customer.
            </p>
            
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={cancelMultiParcelScan}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  background: 'white',
                  color: '#374151',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '14px'
                }}
              >
                Cancel Scan
              </button>
              <button
                onClick={confirmMultiParcelScan}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#2563EB',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '14px'
                }}
              >
                Confirm Scan
              </button>
            </div>
          </div>
        </div>
      )}

    {viewMode === 'manifest' ? (
      <ManifestDetailsView />
    ) : (
      <>
        {/* Header */}
        <div style={{ maxWidth: '1280px', margin: '0 auto 24px' }}>
          <div style={cardStyle}>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '16px', 
              marginBottom: '24px'
            }}>
              <div>
                <h1 style={{ 
                  fontSize: '24px', 
                  fontWeight: '700', 
                  color: '#111827',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Package style={{ color: '#2563EB' }} />
                  <span>Parcel Scanner</span>
                </h1>
                <p style={{ 
                  fontSize: '14px', 
                  color: '#6B7280',
                  marginTop: '4px'
                }}>
                  {isScanning ? 'Ready to scan packages' : 'Start scanning to process parcels'}
                </p>
              </div>
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '16px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  padding: '8px 12px',
                  backgroundColor: '#F3F4F6',
                  borderRadius: '8px'
                }}>
                  {isOnline ? (
                    <>
                      <Wifi style={{ width: '20px', height: '20px', color: '#10B981' }} />
                      <span style={{ fontSize: '14px', color: '#059669' }}>Online</span>
                    </>
                  ) : (
                    <>
                      <WifiOff style={{ width: '20px', height: '20px', color: '#EF4444' }} />
                      <span style={{ fontSize: '14px', color: '#DC2626' }}>Offline</span>
                    </>
                  )}
                </div>
                {pendingScans.length > 0 && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    padding: '8px 12px',
                    backgroundColor: '#FFFBEB',
                    borderRadius: '8px',
                    border: '1px solid #FDE68A'
                  }}>
                    <RefreshCw style={{ 
                      width: '16px', 
                      height: '16px', 
                      color: '#D97706',
                      animation: 'spin 1s linear infinite'
                    }} />
                    <span style={{ fontSize: '14px', color: '#92400E' }}>
                      {pendingScans.length} pending sync
                    </span>
                  </div>
                )}
              </div>
            </div>

<div style={{ 
  marginBottom: '16px',
  backgroundColor: '#F9FAFB',
  padding: '16px',
  borderRadius: '8px',
  border: '1px solid #E5E7EB'
}}>
<label style={{ 
  display: 'block',
  fontSize: '14px',
  fontWeight: '500',
  color: '#374151',
  marginBottom: '8px'
}}>
  Select Manifest
</label>
<select
  value={selectedManifest}
  onChange={(e) => setSelectedManifest(e.target.value)}
  style={{
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: 'white'
  }}
  disabled={manifests.length === 0}
>
  {manifests.length === 0 ? (
    <option value="">Loading manifests...</option>
  ) : (
    <>
      <option value="">Select a manifest</option>
      {manifests.map(manifest => (
        <option key={manifest.manifestNumber} value={manifest.manifestNumber}>
          {manifest.manifestNumber} ({manifest.date ? new Date(manifest.date).toLocaleDateString() : 'No date'}) - 
          {manifest.receivedParcels}/{manifest.totalParcels} parcels
        </option>
      ))}
    </>
  )}
</select>

  
<button
  onClick={() => loadManifestDetails(selectedManifest)}
  disabled={!selectedManifest}
  style={{
    ...buttonStyle,
    backgroundColor: !selectedManifest ? '#F3F4F6' : '#2563EB',
    color: !selectedManifest ? '#9CA3AF' : 'white',
    marginTop: '8px',
    width: '100%',
    cursor: !selectedManifest ? 'not-allowed' : 'pointer'
  }}
>
  <Package size={16} />
  <span>View Manifest Details</span>
</button>
</div>

            {/* User Setup and Controls */}
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '24px'
            }}>
              {/* User Profile */}
              <div style={{ 
                backgroundColor: '#F9FAFB',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB'
              }}>
                <label style={{ 
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <User style={{ width: '16px', height: '16px' }} />
                  <span>Operator</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={userName}
                  onChange={(e) => saveUserName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    outline: 'none',
                    fontSize: '14px'
                  }}
                />
                <div style={{ 
                  marginTop: '8px',
                  fontSize: '12px',
                  color: '#6B7280'
                }}>
                  {userName ? `Operator ID: ${userId}` : 'Please enter your name'}
                </div>
              </div>

              {/* Scanner Controls */}
              <div style={{ 
                backgroundColor: '#EFF6FF',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #BFDBFE'
              }}>
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}>
                  <h3 style={{ 
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#1E40AF'
                  }}>
                    Scanner Controls
                  </h3>
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    color: '#2563EB'
                  }}>
                    <Package style={{ width: '16px', height: '16px' }} />
                    <span>{scanCount} scans</span>
                  </div>
                </div>
                <button
                  onClick={toggleScanning}
                  style={scanButtonStyle}
                >
                  {isScanning ? (
                    <>
                      <Pause style={{ width: '20px', height: '20px' }} />
                      <span>Stop Scanning</span>
                    </>
                  ) : (
                    <>
                      <Play style={{ width: '20px', height: '20px' }} />
                      <span>Start Scanning</span>
                    </>
                  )}
                </button>
              </div>

              {/* Scanner Status */}
              <div style={{ 
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid',
                ...(isScanning 
                  ? { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }
                  : { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' }
                )
              }}>
                <h3 style={{ 
                  fontSize: '14px',
                  fontWeight: '500',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  ...(isScanning 
                    ? { color: '#065F46' }
                    : { color: '#374151' }
                  )
                }}>
                  {isScanning ? (
                    <>
                      <div style={{ 
                        width: '8px',
                        height: '8px',
                        backgroundColor: '#10B981',
                        borderRadius: '9999px',
                        animation: 'pulse 2s infinite'
                      }}></div>
                      <span>Scanner Active</span>
                    </>
                  ) : (
                    <span>Scanner Status</span>
                  )}
                </h3>
                <p style={{ 
                  fontSize: '12px',
                  color: isScanning ? '#047857' : '#6B7280'
                }}>
                  {isScanning 
                    ? 'Ready to scan barcodes. Use your barcode scanner or type codes directly.'
                    : 'Scanner is currently inactive. Click "Start Scanning" to begin.'}
                </p>
              </div>
            </div>

            {/* Scan Input Field */}
            <div style={{ 
              marginTop: '24px',
              padding: '16px',
              backgroundColor: '#F3F4F6',
              borderRadius: '8px',
              border: '1px solid #E5E7EB'
            }}>
              <div>
                <label style={{ 
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Scan or Type Tracking Number
                </label>
                <input
                  type="text"
                  value={scanInput}
                  onChange={handleScanInputChange}
                  onKeyDown={handleScanInputKeyDown}
                  placeholder={isScanning ? "Scan barcode or type and press Enter" : "Start scanning to enable"}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '16px',
                    outline: 'none',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
                    backgroundColor: isScanning ? 'white' : '#F3F4F6',
                    cursor: isScanning ? 'text' : 'not-allowed'
                  }}
                  disabled={!isScanning}
                  ref={inputRef}
                  autoFocus={isScanning}
                />
                <p style={{ 
                  marginTop: '8px',
                  fontSize: '12px',
                  color: '#6B7280'
                }}>
                  {isScanning 
                    ? 'Scan barcodes automatically or type and press Enter'
                    : 'Enable scanning to use this field'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ 
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '24px'
        }}>
          {/* Recent Scans */}
          <div style={{ 
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <div style={{ 
              padding: '24px',
              borderBottom: '1px solid #E5E7EB'
            }}>
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <h2 style={{ 
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#111827'
                }}>
                  Recent Scans
                </h2>
                <span style={{ 
                  fontSize: '12px',
                  backgroundColor: '#F3F4F6',
                  color: '#4B5563',
                  padding: '4px 8px',
                  borderRadius: '9999px'
                }}>
                  {recentScans.length} items
                </span>
              </div>
            </div>
            <div style={{ 
              maxHeight: '500px',
              overflowY: 'auto'
            }}>
              {recentScans.length === 0 ? (
  <div style={{ 
    padding: '32px 24px', 
    textAlign: 'center',
    color: '#6B7280',
    fontSize: '14px'
  }}>
    <Package style={{ 
      width: '48px', 
      height: '48px', 
      color: '#E5E7EB',
      marginBottom: '12px'
    }} />
    <p style={{ fontWeight: '500' }}>No scans yet</p>
    <p>Start scanning to see activity here</p>
  </div>
) : (
  <table style={{ 
    width: '100%', 
    borderCollapse: 'collapse',
    tableLayout: 'fixed'
  }}>
    <thead style={{ 
      backgroundColor: '#F9FAFB',
      position: 'sticky',
      top: 0,
      zIndex: 10
    }}>
      <tr>
        <th style={{ 
          padding: '12px 16px',
          textAlign: 'left',
          fontSize: '12px',
          fontWeight: '500',
          color: '#6B7280',
          borderBottom: '1px solid #E5E7EB',
          width: '30%'
        }}>
          Tracking Number
        </th>
        <th style={{ 
          padding: '12px 16px',
          textAlign: 'left',
          fontSize: '12px',
          fontWeight: '500',
          color: '#6B7280',
          borderBottom: '1px solid #E5E7EB',
          width: '25%'
        }}>
          Customer
        </th>
        <th style={{ 
          padding: '12px 16px',
          textAlign: 'left',
          fontSize: '12px',
          fontWeight: '500',
          color: '#6B7280',
          borderBottom: '1px solid #E5E7EB',
          width: '20%'
        }}>
          Time
        </th>
        <th style={{ 
          padding: '12px 16px',
          textAlign: 'left',
          fontSize: '12px',
          fontWeight: '500',
          color: '#6B7280',
          borderBottom: '1px solid #E5E7EB',
          width: '25%'
        }}>
          Status
        </th>
      </tr>
    </thead>
    <tbody>
      {recentScans.map((scan) => {
        const customerName = extractCustomerName(scan.trackingNumber);
        const isMultiParcel = customerName && isMultiParcelCustomer(scan.trackingNumber);
        const statusStyle = getStatusColor(scan.status, scan.trackingNumber);
        
        return (
          <tr 
            key={scan.id} 
            style={{ 
              borderBottom: '1px solid #E5E7EB',
              ':hover': { backgroundColor: '#F9FAFB' }
            }}
          >
            <td style={{ 
              padding: '16px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#111827',
              wordBreak: 'break-word'
            }}>
              {scan.trackingNumber}
            </td>
            <td style={{ 
              padding: '16px',
              fontSize: '14px',
              color: '#6B7280',
              wordBreak: 'break-word'
            }}>
              {customerName || 'Unknown'}
              {isMultiParcel && (
                <span style={{ 
                  display: 'inline-block',
                  marginLeft: '8px',
                  backgroundColor: '#EDE9FE',
                  color: '#5B21B6',
                  padding: '2px 6px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  Multi
                </span>
              )}
            </td>
            <td style={{ 
              padding: '16px',
              fontSize: '14px',
              color: '#6B7280'
            }}>
              {new Date(scan.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </td>
            <td style={{ padding: '16px' }}>
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: '6px',
                border: `1px solid ${statusStyle.borderColor}`,
                backgroundColor: statusStyle.backgroundColor,
                color: statusStyle.color,
                fontSize: '14px'
              }}>
                {getStatusIcon(scan.status)}
                <span>{scan.message}</span>
              </div>
            </td>
          </tr>
        );
      })}
    </tbody>
  </table>
)}
            </div>
          </div>

          {/* Customer Stats */}
          <div style={{ 
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <div style={{ 
              padding: '24px',
              borderBottom: '1px solid #E5E7EB'
            }}>
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <h2 style={{ 
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#111827'
                }}>
                  Customer Statistics
                </h2>
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
            <table style={{ minWidth: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead style={{ backgroundColor: '#F9FAFB' }}>
                <tr>
                  <th style={{ 
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#6B7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #E5E7EB'
                  }}>
                    Customer
                  </th>
                  <th style={{ 
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#6B7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #E5E7EB'
                  }}>
                    Total
                  </th>
                  <th style={{ 
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#6B7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #E5E7EB'
                  }}>
                    Received
                  </th>
                  <th style={{ 
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#6B7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #E5E7EB'
                  }}>
                    Rate
                  </th>
                </tr>
              </thead>
 <tbody style={{ backgroundColor: 'white' }}>
  {!selectedManifest ? (
    <tr>
      <td colSpan="4" style={{ padding: '32px 24px', textAlign: 'center' }}>
        <h3 style={{ 
          marginTop: '8px',
          fontSize: '14px',
          fontWeight: '500',
          color: '#111827'
        }}>
          No manifest selected
        </h3>
        <p style={{ 
          marginTop: '4px',
          fontSize: '14px',
          color: '#6B7280'
        }}>
          Please select a manifest to view customer statistics
        </p>
      </td>
    </tr>
  ) : isLoadingStats ? (
    <tr>
      <td colSpan="4" style={{ padding: '24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
          <RefreshCw className="animate-spin" size={16} />
          <span>Loading customer statistics...</span>
        </div>
      </td>
    </tr>
  ) : customerStats.length === 0 ? (
    <tr>
      <td colSpan="4" style={{ padding: '32px 24px', textAlign: 'center' }}>
        <h3 style={{ 
          marginTop: '8px',
          fontSize: '14px',
          fontWeight: '500',
          color: '#111827'
        }}>
          No customer data found
        </h3>
        <p style={{ 
          marginTop: '4px',
          fontSize: '14px',
          color: '#6B7280'
        }}>
          No parcels found in manifest {selectedManifest}
        </p>
      </td>
    </tr>
  ) : (
    customerStats.map((stat, index) => (
                    <tr key={index} style={{ 
                      borderBottom: '1px solid #E5E7EB',
                      transition: 'background-color 0.2s',
                      ':hover': { backgroundColor: '#F9FAFB' }
                    }}>
                      <td style={{ 
                        padding: '16px 24px',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#111827',
                        whiteSpace: 'nowrap'
                      }}>
                        {stat._id}
                      </td>
                      <td style={{ 
                        padding: '16px 24px',
                        fontSize: '14px',
                        color: '#6B7280',
                        whiteSpace: 'nowrap'
                      }}>
                        {stat.parcelCount}
                      </td>
                      <td style={{ 
                        padding: '16px 24px',
                        fontSize: '14px',
                        color: '#6B7280',
                        whiteSpace: 'nowrap'
                      }}>
                        {stat.receivedCount}
                      </td>
                      <td style={{ 
                        padding: '16px 24px',
                        whiteSpace: 'nowrap'
                      }}>
                        <div style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px'
                        }}>
                          <div style={{ 
                            width: '80px',
                            backgroundColor: '#E5E7EB',
                            borderRadius: '9999px',
                            height: '8px'
                          }}>
                            <div 
                              style={{ 
                                backgroundColor: '#2563EB',
                                height: '8px',
                                borderRadius: '9999px',
                                width: `${(stat.receivedCount / stat.parcelCount) * 100}%`
                              }}
                            ></div>
                          </div>
                          <span style={{ 
                            fontSize: '12px',
                            fontWeight: '500',
                            color: '#6B7280'
                          }}>
                            {Math.round((stat.receivedCount / stat.parcelCount) * 100)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      </>
    )}

      {/* Global styles for animations */}
      <style>{`
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `}</style>
    </div>
  );
};

export default ScanParcels;