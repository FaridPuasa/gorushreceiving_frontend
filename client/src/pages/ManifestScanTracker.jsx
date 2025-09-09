import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, 
  CheckCircle, 
  Clock, 
  Search, 
  RefreshCw, 
  Eye, 
  EyeOff,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Filter,
  Download,
  Printer
} from 'lucide-react';

const ManifestScanTracker = () => {
  // Define all styles
  const styles = {
    page: {
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      padding: '24px'
    },
    container: {
      maxWidth: '1280px',
      margin: '0 auto'
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      padding: '24px',
      marginBottom: '24px'
    },
    header: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    },
    headerTitle: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#111827',
      margin: 0
    },
    headerSubtitle: {
      color: '#6b7280',
      margin: 0
    },
    headerActions: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    },
    searchInput: {
      paddingLeft: '40px',
      paddingRight: '16px',
      paddingTop: '8px',
      paddingBottom: '8px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      outline: 'none',
      fontSize: '14px',
      width: '100%'
    },
    filterSelect: {
      paddingLeft: '40px',
      paddingRight: '16px',
      paddingTop: '8px',
      paddingBottom: '8px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      outline: 'none',
      fontSize: '14px',
      appearance: 'none'
    },
    primaryButton: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '8px 16px',
      border: 'none',
      borderRadius: '8px',
      backgroundColor: '#2563eb',
      color: 'white',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer'
    },
    secondaryButton: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '8px 16px',
      border: 'none',
      borderRadius: '8px',
      backgroundColor: '#f3f4f6',
      color: '#374151',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '24px',
      marginBottom: '24px'
    },
    statCard: {
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      padding: '24px'
    },
    statIcon: {
      padding: '12px',
      borderRadius: '8px',
      color: '#2563eb'
    },
    statValue: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#111827',
      margin: 0
    },
    statLabel: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#6b7280',
      margin: 0
    },
    sortingControls: {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      padding: '16px',
      marginBottom: '24px'
    },
    sortButton: {
      padding: '8px 12px',
      borderRadius: '6px',
      backgroundColor: '#f3f4f6',
      color: '#374151',
      fontSize: '14px',
      cursor: 'pointer',
      border: 'none'
    },
    activeSortButton: {
      backgroundColor: '#dbeafe',
      color: '#1e40af'
    },
    manifestItem: {
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden',
      marginBottom: '16px'
    },
    manifestHeader: {
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    },
    manifestTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#111827',
      margin: 0
    },
    manifestDate: {
      fontSize: '14px',
      color: '#6b7280',
      margin: 0
    },
    statusBadge: {
      padding: '4px 12px',
      borderRadius: '9999px',
      fontSize: '14px',
      fontWeight: '500'
    },
    progressBar: {
      width: '100%',
      height: '10px',
      backgroundColor: '#e5e7eb',
      borderRadius: '9999px',
      marginTop: '16px'
    },
    progressFill: {
      height: '10px',
      borderRadius: '9999px',
      transition: 'width 0.5s ease'
    },
    detailsSection: {
      borderTop: '1px solid #e5e7eb',
      backgroundColor: '#f9fafb'
    },
    parcelsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
      gap: '24px',
      padding: '24px'
    },
    parcelList: {
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
      overflow: 'hidden'
    },
    parcelListHeader: {
      padding: '16px',
      borderBottom: '1px solid #e5e7eb',
      backgroundColor: '#f3f4f6'
    },
    parcelItem: {
      padding: '16px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start'
    },
    emptyState: {
      padding: '48px',
      textAlign: 'center',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    },
    loadingState: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '256px'
    },
    errorState: {
      backgroundColor: '#fef2f2',
      border: '1px solid #fecaca',
      borderRadius: '8px',
      padding: '16px'
    }
  };

  // Component state and logic
  const [manifests, setManifests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedManifests, setExpandedManifests] = useState(new Set());
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [itemsPerPage] = useState(5);
  const [displayedItems, setDisplayedItems] = useState(5);
  const [isLoadingMore, setIsLoadingMore] = useState(false);


  // Fetch manifests data
  const fetchManifests = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://grscanningsystemserver.onrender.com/api/manifests');
      if (!response.ok) throw new Error('Failed to fetch manifests');
      
      const data = await response.json();
      setManifests(data.manifests || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManifests();
  }, []);

  // Get scan statistics for a manifest
  const getManifestStats = (manifest) => {
    const total = manifest.parcels.length;
    const scanned = manifest.parcels.filter(p => p.received).length;
    const pending = total - scanned;
    const percentage = total > 0 ? Math.round((scanned / total) * 100) : 0;
    
    return { total, scanned, pending, percentage };
  };

  // Toggle manifest expansion
  const toggleManifest = (manifestNumber) => {
    const newExpanded = new Set(expandedManifests);
    if (newExpanded.has(manifestNumber)) {
      newExpanded.delete(manifestNumber);
    } else {
      newExpanded.add(manifestNumber);
    }
    setExpandedManifests(newExpanded);
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

const exportToCSV = (manifest) => {
  const stats = getManifestStats(manifest);
  
  // Create CSV header
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += `Manifest Number,${manifest.manifestNumber}\n`;
  csvContent += `Product,${manifest.product || 'N/A'}\n`;
  csvContent += `Created At,${formatDate(manifest.createdAt)}\n`;
  csvContent += `Status,${stats.percentage}% Complete\n`;
  csvContent += `Total Parcels,${stats.total}\n`;
  csvContent += `Scanned Parcels,${stats.scanned}\n`;
  csvContent += `Pending Parcels,${stats.pending}\n\n`;
  
  // Add scanned parcels section
  if (stats.scanned > 0) {
    csvContent += `Scanned Parcels (${stats.scanned})\n`;
    csvContent += "Tracking Number,Consignee Name,Received At,Received By\n";
    manifest.parcels
      .filter(p => p.received)
      .forEach(p => {
        csvContent += `${p.trackingNumber},"${p.consigneeName}",${p.receivedAt ? formatDate(p.receivedAt) : ''},"${p.receivedBy || ''}"\n`;
      });
    csvContent += '\n';
  }
  
  // Add pending parcels section
  if (stats.pending > 0) {
    csvContent += `Pending Parcels (${stats.pending})\n`;
    csvContent += "Tracking Number,Consignee Name,Shipment Date\n";
    manifest.parcels
      .filter(p => !p.received)
      .forEach(p => {
        csvContent += `${p.trackingNumber},"${p.consigneeName}",${p.shipmentDate ? formatDate(p.shipmentDate) : ''}\n`;
      });
  }
  
  // Create download link
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${manifest.manifestNumber}_scan_report.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};


  // Filter and sort manifests
const filteredManifests = useMemo(() => {
  return manifests
    .filter(manifest => {
      // Search filter
      const matchesSearch = manifest.manifestNumber.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter
      const stats = getManifestStats(manifest);
      let matchesStatus = true;
      if (filterStatus === 'completed') matchesStatus = stats.percentage === 100;
      if (filterStatus === 'in-progress') matchesStatus = stats.percentage > 0 && stats.percentage < 100;
      if (filterStatus === 'not-started') matchesStatus = stats.percentage === 0;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const statsA = getManifestStats(a);
      const statsB = getManifestStats(b);
      
      if (sortBy === 'date') {
        return sortOrder === 'asc' 
          ? new Date(a.createdAt) - new Date(b.createdAt)
          : new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (sortBy === 'completion') {
        return sortOrder === 'asc' 
          ? statsA.percentage - statsB.percentage
          : statsB.percentage - statsA.percentage;
      }
      if (sortBy === 'manifest') {
        return sortOrder === 'asc' 
          ? a.manifestNumber.localeCompare(b.manifestNumber)
          : b.manifestNumber.localeCompare(a.manifestNumber);
      }
      return 0;
    });
}, [manifests, searchTerm, filterStatus, sortBy, sortOrder]);

// Get currently displayed manifests
const displayedManifests = filteredManifests.slice(0, displayedItems);

useEffect(() => {
  setDisplayedItems(itemsPerPage);
}, [searchTerm, filterStatus, sortBy, sortOrder, itemsPerPage]);

const loadMore = () => {
  setIsLoadingMore(true);
  // Simulate loading delay for better UX
  setTimeout(() => {
    setDisplayedItems(prev => Math.min(prev + itemsPerPage, filteredManifests.length));
    setIsLoadingMore(false);
  }, 500);
};

  // Get status color based on completion percentage
  const getStatusColor = (percentage) => {
    if (percentage === 100) return { color: '#166534', backgroundColor: '#dcfce7' };
    if (percentage >= 75) return { color: '#1e40af', backgroundColor: '#dbeafe' };
    if (percentage >= 50) return { color: '#92400e', backgroundColor: '#fef3c7' };
    return { color: '#991b1b', backgroundColor: '#fee2e2' };
  };

  // Loading state
  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.loadingState}>
            <RefreshCw style={{ width: '32px', height: '32px', color: '#2563eb', animation: 'spin 1s linear infinite' }} />
            <span style={{ marginLeft: '8px', fontSize: '18px' }}>Loading manifests...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.errorState}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <AlertCircle style={{ width: '20px', height: '20px', color: '#dc2626', marginRight: '8px' }} />
              <div style={{ color: '#dc2626', fontWeight: '500' }}>Error loading manifests</div>
            </div>
            <div style={{ color: '#dc2626', marginTop: '4px' }}>{error}</div>
            <button 
              onClick={fetchManifests}
              style={{ 
                marginTop: '12px', 
                backgroundColor: '#dc2626', 
                color: 'white', 
                padding: '8px 16px', 
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.card}>
          <div style={styles.header}>
            <div>
              <h1 style={styles.headerTitle}>Manifest Scan Tracker</h1>
              <p style={styles.headerSubtitle}>Track scanning progress for all manifests</p>
            </div>
            
            <div style={styles.headerActions}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ position: 'relative' }}>
                  <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                  <input
                    type="text"
                    placeholder="Search manifests..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={styles.searchInput}
                  />
                </div>
                
                <div style={{ position: 'relative' }}>
                  <Filter style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={styles.filterSelect}
                  >
                    <option value="all">All Statuses</option>
                    <option value="completed">Completed</option>
                    <option value="in-progress">In Progress</option>
                    <option value="not-started">Not Started</option>
                  </select>
                </div>
              </div>
              
              <button
                onClick={fetchManifests}
                style={styles.primaryButton}
              >
                <RefreshCw style={{ width: '16px', height: '16px', marginRight: '8px' }} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ ...styles.statIcon, backgroundColor: '#dbeafe', color: '#2563eb' }}>
                <Package style={{ width: '24px', height: '24px' }} />
              </div>
              <div style={{ marginLeft: '16px' }}>
                <p style={styles.statLabel}>Total Manifests</p>
                <p style={styles.statValue}>{manifests.length}</p>
              </div>
            </div>
          </div>
          
          <div style={styles.statCard}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ ...styles.statIcon, backgroundColor: '#dcfce7', color: '#16a34a' }}>
                <CheckCircle style={{ width: '24px', height: '24px' }} />
              </div>
              <div style={{ marginLeft: '16px' }}>
                <p style={styles.statLabel}>Completed</p>
                <p style={styles.statValue}>
                  {manifests.filter(m => getManifestStats(m).percentage === 100).length}
                </p>
              </div>
            </div>
          </div>
          
          <div style={styles.statCard}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ ...styles.statIcon, backgroundColor: '#fef3c7', color: '#d97706' }}>
                <Clock style={{ width: '24px', height: '24px' }} />
              </div>
              <div style={{ marginLeft: '16px' }}>
                <p style={styles.statLabel}>In Progress</p>
                <p style={styles.statValue}>
                  {manifests.filter(m => {
                    const stats = getManifestStats(m);
                    return stats.percentage > 0 && stats.percentage < 100;
                  }).length}
                </p>
              </div>
            </div>
          </div>
          
          <div style={styles.statCard}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ ...styles.statIcon, backgroundColor: '#fee2e2', color: '#dc2626' }}>
                <Package style={{ width: '24px', height: '24px' }} />
              </div>
              <div style={{ marginLeft: '16px' }}>
                <p style={styles.statLabel}>Not Started</p>
                <p style={styles.statValue}>
                  {manifests.filter(m => getManifestStats(m).percentage === 0).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sorting Controls */}
        <div style={styles.sortingControls}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280' }}>Sort by:</span>
            <button
              onClick={() => {
                setSortBy('date');
                setSortOrder(sortBy === 'date' ? (sortOrder === 'asc' ? 'desc' : 'asc') : 'desc');
              }}
              style={{
                ...styles.sortButton,
                ...(sortBy === 'date' ? styles.activeSortButton : {})
              }}
            >
              Date {sortBy === 'date' && (sortOrder === 'asc' ? <ChevronUp style={{ display: 'inline', marginLeft: '4px' }} /> : <ChevronDown style={{ display: 'inline', marginLeft: '4px' }} />)}
            </button>
            <button
              onClick={() => {
                setSortBy('completion');
                setSortOrder(sortBy === 'completion' ? (sortOrder === 'asc' ? 'desc' : 'asc') : 'desc');
              }}
              style={{
                ...styles.sortButton,
                ...(sortBy === 'completion' ? styles.activeSortButton : {})
              }}
            >
              Completion {sortBy === 'completion' && (sortOrder === 'asc' ? <ChevronUp style={{ display: 'inline', marginLeft: '4px' }} /> : <ChevronDown style={{ display: 'inline', marginLeft: '4px' }} />)}
            </button>
          </div>
        </div>

        {/* Manifests List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {displayedManifests.map((manifest) => {
            const stats = getManifestStats(manifest);
            const isExpanded = expandedManifests.has(manifest.manifestNumber);
            const statusColor = getStatusColor(stats.percentage);
            
            return (
              <div key={manifest.manifestNumber} style={styles.manifestItem}>
                <div style={styles.manifestHeader}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ flexShrink: 0 }}>
                        <div style={{ padding: '8px', borderRadius: '8px', ...statusColor }}>
                          <Package style={{ width: '20px', height: '20px' }} />
                        </div>
                      </div>
                      
                      <div>
                        <h3 style={styles.manifestTitle}>{manifest.manifestNumber}</h3>
                        <p style={styles.manifestDate}>Created: {formatDate(manifest.createdAt)}</p>
                      </div>
                      
                      <div style={{ 
                        ...styles.statusBadge,
                        backgroundColor: statusColor.backgroundColor,
                        color: statusColor.color
                      }}>
                        {stats.percentage}% Complete
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a' }}>{stats.scanned}</div>
                          <div style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase' }}>Scanned</div>
                        </div>
                        
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ea580c' }}>{stats.pending}</div>
                          <div style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase' }}>Pending</div>
                        </div>
                        
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>{stats.total}</div>
                          <div style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase' }}>Total</div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => exportToCSV(manifest)}
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '4px', 
                              padding: '8px 12px',
                              backgroundColor: '#f3f4f6',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: '500'
                            }}
                          >
                            <Download style={{ width: '16px', height: '16px', color: "black" }} />
                            <span style={{color: "black"}}>Export</span>
                          </button>
                          
                          <button
                            onClick={() => toggleManifest(manifest.manifestNumber)}
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '4px', 
                              padding: '8px 12px',
                              backgroundColor: '#f3f4f6',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: '500'
                            }}
                          >
                            {isExpanded ? (
                              <>
                                <EyeOff style={{ width: '16px', height: '16px', color: "black" }} />
                                <span style={{color: "black"}}>Hide</span>
                              </>
                            ) : (
                              <>
                                <Eye style={{ width: '16px', height: '16px', color: "black" }} />
                                <span style={{color: "black"}}>View</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div style={styles.progressBar}>
                    <div 
                      style={{ 
                        ...styles.progressFill,
                        backgroundColor: statusColor.color,
                        width: `${stats.percentage}%`
                      }}
                    ></div>
                  </div>
                </div>
                
                {/* Expanded Details */}
                {isExpanded && (
                  <div style={styles.detailsSection}>
                    <div style={styles.parcelsGrid}>
                      {/* Scanned Parcels */}
                      <div style={styles.parcelList}>
                        <div style={{ ...styles.parcelListHeader, backgroundColor: '#dcfce7' }}>
                          <h4 style={{ 
                            fontSize: '18px', 
                            fontWeight: '500', 
                            color: '#111827', 
                            margin: 0,
                            display: 'flex',
                            alignItems: 'center'
                          }}>
                            <CheckCircle style={{ width: '20px', height: '20px', color: '#16a34a', marginRight: '8px' }} />
                            Scanned Parcels ({stats.scanned})
                          </h4>
                        </div>
                        <div style={{ maxHeight: '384px', overflowY: 'auto' }}>
                          {manifest.parcels
                            .filter(p => p.received)
                            .map((parcel, index) => (
                              <div key={index} style={styles.parcelItem}>
                                <div>
                                  <div style={{ fontWeight: '500', color: '#111827' }}>{parcel.trackingNumber}</div>
                                  <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>{parcel.consigneeName}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                                    {parcel.receivedAt && formatDate(parcel.receivedAt)}
                                  </div>
                                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                                    by {parcel.receivedBy || 'Unknown'}
                                  </div>
                                </div>
                              </div>
                            ))}
                          {stats.scanned === 0 && (
                            <div style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>
                              No parcels scanned yet
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Pending Parcels */}
                      <div style={styles.parcelList}>
                        <div style={{ ...styles.parcelListHeader, backgroundColor: '#ffedd5' }}>
                          <h4 style={{ 
                            fontSize: '18px', 
                            fontWeight: '500', 
                            color: '#111827', 
                            margin: 0,
                            display: 'flex',
                            alignItems: 'center'
                          }}>
                            <Clock style={{ width: '20px', height: '20px', color: '#ea580c', marginRight: '8px' }} />
                            Pending Parcels ({stats.pending})
                          </h4>
                        </div>
                        <div style={{ maxHeight: '384px', overflowY: 'auto' }}>
                          {manifest.parcels
                            .filter(p => !p.received)
                            .map((parcel, index) => (
                              <div key={index} style={styles.parcelItem}>
                                <div>
                                  <div style={{ fontWeight: '500', color: '#111827' }}>{parcel.trackingNumber}</div>
                                  <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>{parcel.consigneeName}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                                    {parcel.shipmentDate && formatDate(parcel.shipmentDate)}
                                  </div>
                                  <div style={{ fontSize: '12px', fontWeight: '500', color: '#ea580c', marginTop: '4px' }}>
                                    Awaiting Scan
                                  </div>
                                </div>
                              </div>
                            ))}
                          {stats.pending === 0 && (
                            <div style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>
                              All parcels have been scanned!
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Load More */}
        {displayedItems < filteredManifests.length && (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginTop: '32px',
    marginBottom: '24px'
  }}>
    <button
      onClick={loadMore}
      disabled={isLoadingMore}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 24px',
        backgroundColor: isLoadingMore ? '#f3f4f6' : '#2563eb',
        color: isLoadingMore ? '#9ca3af' : 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: '500',
        cursor: isLoadingMore ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease'
      }}
    >
      {isLoadingMore ? (
        <>
          <RefreshCw style={{ 
            width: '20px', 
            height: '20px', 
            animation: 'spin 1s linear infinite' 
          }} />
          Loading...
        </>
      ) : (
        <>
          <ChevronDown style={{ width: '20px', height: '20px' }} />
          Load More ({Math.min(itemsPerPage, filteredManifests.length - displayedItems)} more)
        </>
      )}
    </button>
  </div>
)}

{/* Pagination Info */}
{filteredManifests.length > 0 && (
  <div style={{
    textAlign: 'center',
    color: '#6b7280',
    fontSize: '14px',
    marginBottom: '24px'
  }}>
    Showing {displayedItems} of {filteredManifests.length} manifests
  </div>
)}
        
        {filteredManifests.length === 0 && (
          <div style={styles.emptyState}>
            <Package style={{ width: '48px', height: '48px', color: '#9ca3af', margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '500', color: '#111827', marginBottom: '8px' }}>No manifests found</h3>
            <p style={{ color: '#6b7280' }}>
              {searchTerm ? 'Try adjusting your search or filter criteria.' : 'No manifests have been created yet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManifestScanTracker;