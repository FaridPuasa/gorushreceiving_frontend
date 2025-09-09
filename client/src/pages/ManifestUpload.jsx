import React, { useState } from 'react';

const Upload = () => {
  const [tableData, setTableData] = useState([{}]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [manifestNumber, setManifestNumber] = useState('');

  const expectedHeaders = [
    'Tracking Number', 'Shipment Date', 'AWB Number', 'Consignee Name', 
    'Consignee Phone Number', 'Consignee Email', 'Consignee Address', 
    'Zip Code', 'Description', 'Actual Weight', 'Declared Value (USD)'
  ];

  const handlePaste = (e, startRowIndex, header) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text');
    const pastedValues = paste.split('\n')
      .map(v => v.trim())
      .filter(v => v); // Remove empty lines
    
    const newData = [...tableData];
    
    // Ensure we have enough rows for the paste
    const neededRows = startRowIndex + pastedValues.length;
    while (newData.length < neededRows) {
      newData.push({});
    }

    // Update cells with pasted values
    pastedValues.forEach((value, i) => {
      const rowIndex = startRowIndex + i;
      newData[rowIndex] = newData[rowIndex] || {};
      newData[rowIndex][header] = value;
    });

    setTableData(newData);
  };

  const handleCellChange = (rowIndex, header, value) => {
    const newData = [...tableData];
    newData[rowIndex] = newData[rowIndex] || {};
    newData[rowIndex][header] = value;
    setTableData(newData);
  };

  const handleSubmit = async () => {
    // Filter out completely empty rows (where all fields are empty)
    const dataToSubmit = tableData.filter(row => 
      Object.values(row).some(value => value !== undefined && value !== '')
    );

      console.log('Submitting data:', { 
    tableData: dataToSubmit,
    manifestNumber 
  });

    if (dataToSubmit.length === 0) {
      setMessage('No data to upload');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('https://gorushscanning-server.onrender.com/api/manifest/paste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tableData: dataToSubmit,
          manifestNumber: manifestNumber.trim() || null // Send null if empty
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      setMessage(`✅ ${result.message} (${result.total} parcels)`);
      setTableData([{}]);
      setManifestNumber('');
      
    } catch (error) {
      setMessage(`❌ ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setTableData([{}]);
    setManifestNumber('');
    setMessage('');
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Parcel Manifest Upload</h1>
        
        <div style={styles.instructions}>
          <h2 style={styles.instructionsTitle}>Instructions:</h2>
          <ol style={styles.instructionsList}>
            <li>Optionally enter a manifest number</li>
            <li>Select and copy entire columns from Excel (1000+ rows supported)</li>
            <li>Click in the corresponding column below the header and paste (Ctrl+V)</li>
            <li>Repeat for other columns as needed</li>
            <li>Click Upload when finished</li>
          </ol>
        </div>

        {/* Manifest Number Input */}
        <div style={styles.manifestNumberContainer}>
          <label style={styles.manifestNumberLabel}>
            Manifest Number:
            <input
              type="text"
              value={manifestNumber}
              onChange={(e) => setManifestNumber(e.target.value)}
              style={styles.manifestNumberInput}
              placeholder="Enter manifest number"
            />
          </label>
        </div>

        {/* Data Table - Virtualized for performance with large datasets */}
        <div style={styles.tableWrapper}>
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.headerRow}>
                  {expectedHeaders.map((header, index) => (
                    <th key={index} style={styles.headerCell}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, rowIndex) => (
                  <tr key={rowIndex} style={rowIndex % 2 === 0 ? styles.evenRow : styles.oddRow}>
                    {expectedHeaders.map((header, colIndex) => (
                      <td key={colIndex} style={styles.cell}>
                        <input
                          type="text"
                          value={row[header] || ''}
                          onChange={(e) => handleCellChange(rowIndex, header, e.target.value)}
                          onPaste={(e) => handlePaste(e, rowIndex, header)}
                          style={styles.cellInput}
                          placeholder={rowIndex === 0 ? 'Paste here' : ''}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Status Bar */}
        <div style={styles.statusBar}>
          {tableData.length > 1 && (
            <div style={styles.rowCount}>
              {tableData.filter(row => Object.values(row).some(v => v)).length} rows with data
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={styles.buttonContainer}>
          <button
            onClick={handleSubmit}
            disabled={isLoading || tableData.every(row => Object.values(row).every(v => !v))}
            style={
              isLoading || tableData.every(row => Object.values(row).every(v => !v))
                ? {...styles.button, ...styles.buttonDisabled}
                : {...styles.button, ...styles.buttonPrimary}
            }
          >
            {isLoading ? 'Processing...' : 'Upload Manifest'}
          </button>
          <button
            onClick={handleClear}
            disabled={isLoading}
            style={styles.buttonSecondary}
          >
            Clear All
          </button>
        </div>

        {/* Message Display */}
        {message && (
          <div style={
            message.includes('✅') 
              ? {...styles.message, ...styles.messageSuccess}
              : message.includes('⚠️') 
                ? {...styles.message, ...styles.messageWarning}
                : {...styles.message, ...styles.messageError}
          }>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
    padding: '24px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  card: {
    maxWidth: '1200px',
    margin: '0 auto',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    padding: '24px'
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '24px'
  },
  instructions: {
    marginBottom: '24px',
    padding: '16px',
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '8px'
  },
  instructionsTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: '8px'
  },
  instructionsList: {
    color: '#1e40af',
    paddingLeft: '20px',
    lineHeight: '1.6'
  },
  manifestNumberContainer: {
    marginBottom: '24px',
    padding: '16px',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px'
  },
  manifestNumberLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '16px',
    fontWeight: '500',
    color: '#1e293b'
  },
  manifestNumberInput: {
    flex: 1,
    padding: '8px 12px',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    fontSize: '16px',
    '&:focus': {
      outline: 'none',
      borderColor: '#60a5fa',
      boxShadow: '0 0 0 3px rgba(96, 165, 250, 0.3)'
    }
  },
  tableWrapper: {
    maxHeight: '500px',
    overflowY: 'auto',
    marginBottom: '16px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px'
  },
  tableContainer: {
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px'
  },
  headerRow: {
    backgroundColor: '#f3f4f6',
    fontWeight: '500',
    position: 'sticky',
    top: 0
  },
  headerCell: {
    padding: '12px',
    textAlign: 'left',
    borderBottom: '2px solid #d1d5db',
    borderRight: '1px solid #d1d5db',
    minWidth: '120px'
  },
  evenRow: {
    backgroundColor: '#ffffff'
  },
  oddRow: {
    backgroundColor: '#f9fafb'
  },
  cell: {
    padding: '0',
    borderBottom: '1px solid #e5e7eb',
    borderRight: '1px solid #e5e7eb',
    minWidth: '120px'
  },
  cellInput: {
    width: '100%',
    padding: '8px 12px',
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    fontSize: '14px',
    fontFamily: 'inherit',
    '&:focus': {
      backgroundColor: '#f0f9ff',
      outline: '2px solid #3b82f6'
    }
  },
  statusBar: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: '16px'
  },
  rowCount: {
    fontSize: '14px',
    color: '#6b7280',
    fontStyle: 'italic'
  },
  buttonContainer: {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px'
  },
  button: {
    padding: '8px 24px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  buttonPrimary: {
    backgroundColor: '#2563eb',
    color: 'white',
    '&:hover': {
      backgroundColor: '#1d4ed8'
    }
  },
  buttonSecondary: {
    backgroundColor: '#4b5563',
    color: 'white',
    '&:hover': {
      backgroundColor: '#374151'
    }
  },
  buttonDisabled: {
    backgroundColor: '#d1d5db',
    color: '#6b7280',
    cursor: 'not-allowed'
  },
  message: {
    padding: '16px',
    borderRadius: '8px',
    fontSize: '14px'
  },
  messageSuccess: {
    backgroundColor: '#ecfdf5',
    border: '1px solid #bbf7d0',
    color: '#166534'
  },
  messageWarning: {
    backgroundColor: '#fffbeb',
    border: '1px solid #fde68a',
    color: '#92400e'
  },
  messageError: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#dc2626'
  }
};

export default Upload;