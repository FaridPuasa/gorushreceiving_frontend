require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const axios = require('axios');

// === CORS SETUP ===
const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000', 'https://grscanningsystem.vercel.app'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// === BODY PARSER ===
app.use(express.json({ limit: '10mb' }));

const parseDate = (dateString) => {
  if (!dateString || typeof dateString !== 'string') {
    return null;
  }
  
  // Remove any extra whitespace
  const cleanDateString = dateString.trim();
  
  // Handle DD/MM/YYYY format (common in many countries)
  const ddmmyyyyPattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const ddmmyyyyMatch = cleanDateString.match(ddmmyyyyPattern);
  
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    // Create date in YYYY-MM-DD format for reliable parsing
    const isoString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    const date = new Date(isoString);
    
    // Validate the date is actually valid
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  
  // Handle MM/DD/YYYY format
  const mmddyyyyPattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const mmddyyyyMatch = cleanDateString.match(mmddyyyyPattern);
  
  if (mmddyyyyMatch) {
    const [, month, day, year] = mmddyyyyMatch;
    // Create date in YYYY-MM-DD format for reliable parsing
    const isoString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    const date = new Date(isoString);
    
    // Validate the date is actually valid
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  
  // Handle YYYY-MM-DD format (ISO format)
  const yyyymmddPattern = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
  const yyyymmddMatch = cleanDateString.match(yyyymmddPattern);
  
  if (yyyymmddMatch) {
    const date = new Date(cleanDateString);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  
  // Try native Date parsing as fallback
  const fallbackDate = new Date(cleanDateString);
  if (!isNaN(fallbackDate.getTime())) {
    return fallbackDate;
  }
  
  // If all parsing attempts fail, return null
  console.warn(`Could not parse date: "${dateString}"`);
  return null;
};

// === CONNECT TO MONGODB ===
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/testdb', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

const parcelSchema = new mongoose.Schema({
  trackingNumber: { type: String, required: true, unique: true },
  consigneeName: { type: String, required: true },
  shipmentDate: Date,
  awbNumber: String,
  consigneePhone: String,
  consigneeEmail: String,
  consigneeAddress: String,
  zipCode: String,
  description: String,
  actualWeight: Number,
  declaredValue: Number,
  manifestNumber: String,
  received: { type: Boolean, default: false },
  receivedAt: Date,
  receivedBy: String,
  // NEW: Multi-user support
  scannedBy: String,
  scannedByUser: String,
  scanHistory: [{
    userId: String,
    userName: String,
    timestamp: Date,
    action: String // 'scanned', 'received', 'updated'
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Add scan session tracking
const scanSessionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userName: String,
  startTime: { type: Date, default: Date.now },
  endTime: Date,
  totalScans: { type: Number, default: 0 },
  successfulScans: { type: Number, default: 0 },
  errorScans: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
});

const ScanSession = mongoose.model('ScanSession', scanSessionSchema);

const manifestSchema = new mongoose.Schema({
  manifestNumber: { type: String, required: true, unique: true },
  date: { type: Date, default: Date.now },
  parcels: [parcelSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Only create Manifest model - no separate Parcel model
const Manifest = mongoose.model('Manifest', manifestSchema);

const mapParcelData = (frontendData) => {
  return {
    trackingNumber: frontendData['Tracking Number'],
    consigneeName: frontendData['Consignee Name'],
    shipmentDate: parseDate(frontendData['Shipment Date']), // Use safe date parsing
    awbNumber: frontendData['AWB Number'],
    consigneePhone: frontendData['Consignee Phone Number'],
    consigneeEmail: frontendData['Consignee Email'],
    consigneeAddress: frontendData['Consignee Address'],
    zipCode: frontendData['Zip Code'],
    description: frontendData['Description'],
    actualWeight: frontendData['Actual Weight'] ? parseFloat(frontendData['Actual Weight']) : null,
    declaredValue: frontendData['Declared Value (USD)'] ? parseFloat(frontendData['Declared Value (USD)']) : null,
    updatedAt: new Date()
  };
};

app.post('/api/manifest/paste', async (req, res) => {
  try {
    const { tableData, manifestNumber } = req.body;

    if (!tableData || !Array.isArray(tableData) || tableData.length === 0) {
      return res.status(400).json({ error: 'No parcel data provided' });
    }

    if (!manifestNumber) {
      return res.status(400).json({ error: 'Manifest number is required' });
    }

    console.log(`Processing manifest ${manifestNumber} with ${tableData.length} parcels...`);

    const results = {
      created: 0,
      updated: 0,
      errors: []
    };

    const parcels = [];

    // Process each parcel
    for (let i = 0; i < tableData.length; i++) {
      const frontendParcel = tableData[i];
      
      try {
        // Map frontend data to backend schema
        const mappedData = mapParcelData(frontendParcel);

        // Validate required fields
        if (!mappedData.trackingNumber || !mappedData.consigneeName) {
          results.errors.push(`Row ${i + 1}: Missing tracking number or consignee name`);
          continue;
        }

        // Log date parsing for debugging
        if (frontendParcel['Shipment Date']) {
          console.log(`Row ${i + 1}: Original date "${frontendParcel['Shipment Date']}" parsed as: ${mappedData.shipmentDate}`);
        }

        // Add to parcels array for the manifest
        parcels.push(mappedData);

      } catch (error) {
        console.error(`Error processing parcel ${i + 1}:`, error);
        results.errors.push(`Row ${i + 1}: ${error.message}`);
      }
    }

    // Create or update the manifest with better error handling
    try {
      const existingManifest = await Manifest.findOne({ manifestNumber });
      
      if (existingManifest) {
        // Check for duplicate tracking numbers within the manifest
        const newParcels = [];
        
        for (const parcel of parcels) {
          const existingParcelIndex = existingManifest.parcels.findIndex(
            p => p.trackingNumber === parcel.trackingNumber
          );
          
          if (existingParcelIndex !== -1) {
            // Update existing parcel within manifest
            existingManifest.parcels[existingParcelIndex] = parcel;
            results.updated++;
          } else {
            // Add new parcel to manifest
            newParcels.push(parcel);
            results.created++;
          }
        }
        
        // Add new parcels to existing manifest
        existingManifest.parcels.push(...newParcels);
        existingManifest.updatedAt = new Date();
        
        // Save with validation error handling
        await existingManifest.save();
        
      } else {
        // Create new manifest with all parcels
        const newManifest = new Manifest({
          manifestNumber,
          parcels,
          updatedAt: new Date()
        });
        
        // Save with validation error handling
        await newManifest.save();
        results.created = parcels.length;
      }
    } catch (error) {
      console.error('Error processing manifest:', error);
      
      // Check if it's a validation error and provide more specific feedback
      if (error.name === 'ValidationError') {
        const validationErrors = Object.keys(error.errors).map(key => {
          const err = error.errors[key];
          if (err.kind === 'date') {
            return `${key}: Invalid date format. Please use DD/MM/YYYY format.`;
          }
          return `${key}: ${err.message}`;
        });
        results.errors.push(...validationErrors);
      } else {
        results.errors.push(`Manifest error: ${error.message}`);
      }
    }

    // Prepare response
    const total = results.created + results.updated;
    let message = `Successfully processed manifest ${manifestNumber} with ${total} parcels`;
    
    if (results.created > 0) {
      message += ` (${results.created} created`;
    }
    if (results.updated > 0) {
      message += `${results.created > 0 ? ', ' : ' ('}${results.updated} updated`;
    }
    if (results.created > 0 || results.updated > 0) {
      message += ')';
    }

    if (results.errors.length > 0) {
      message += `. ${results.errors.length} errors occurred.`;
    }

    res.json({ 
      success: true, 
      message,
      total,
      created: results.created,
      updated: results.updated,
      errors: results.errors
    });

  } catch (error) {
    console.error('Error processing manifest:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/scan', async (req, res) => {
  const { trackingNumber, userId, userName, timestamp, manifestNumber } = req.body;

  if (!trackingNumber) {
    return res.status(400).json({ 
      success: false, 
      message: 'Tracking number is required' 
    });
  }

  try {
    // Find parcel across all manifests
    const manifest = await Manifest.findOne({ 
      'parcels.trackingNumber': trackingNumber 
    });

    if (!manifest) {
      // Log failed scan attempt
      await logScanAttempt(userId, userName, trackingNumber, 'not_found');
      return res.status(404).json({ 
        success: false, 
        message: '❌ Parcel not found in any manifest' 
      });
    }

    const parcelIndex = manifest.parcels.findIndex(
      p => p.trackingNumber === trackingNumber
    );

    if (parcelIndex === -1) {
      await logScanAttempt(userId, userName, trackingNumber, 'not_found');
      return res.status(404).json({ 
        success: false, 
        message: '❌ Parcel not found' 
      });
    }

    const parcel = manifest.parcels[parcelIndex];

    if (parcel.received) {
      await logScanAttempt(userId, userName, trackingNumber, 'already_received');
      return res.status(409).json({ 
        success: false, 
        message: `⚠️ Already received by ${parcel.receivedBy || 'unknown'} on ${parcel.receivedAt ? new Date(parcel.receivedAt).toLocaleString() : 'unknown date'}` 
      });
    }

    // Three-step Detrack status updates with delays
    const detrackResults = {
      customClearing: { success: false, error: null, details: null },
      atWarehouse: { success: false, error: null, details: null },
      inSortingArea: { success: false, error: null, details: null }
    };

    // Step 1: Custom Clearing
    console.log(`Updating Detrack status to "Custom Clearing" for ${trackingNumber}`);
    const detrackResponse1 = await updateDetrackStatus(trackingNumber, 'Custom Clearing');
    detrackResults.customClearing = {
      success: detrackResponse1.success,
      error: detrackResponse1.error,
      details: detrackResponse1.details
    };

    if (!detrackResponse1.success) {
      console.error('Failed to update Detrack status to "Custom Clearing":', detrackResponse1.error);
      // Continue with the scan even if Detrack update fails
    }

    // Update parcel as received (moved before the async scheduling)
    manifest.parcels[parcelIndex].received = true;
    manifest.parcels[parcelIndex].receivedAt = new Date(timestamp || Date.now());
    manifest.parcels[parcelIndex].receivedBy = userName || userId;
    manifest.parcels[parcelIndex].scannedBy = userId;
    manifest.parcels[parcelIndex].scannedByUser = userName;
    manifest.parcels[parcelIndex].updatedAt = new Date();

    // Add to scan history
    if (!manifest.parcels[parcelIndex].scanHistory) {
      manifest.parcels[parcelIndex].scanHistory = [];
    }
    manifest.parcels[parcelIndex].scanHistory.push({
      userId: userId,
      userName: userName,
      timestamp: new Date(timestamp || Date.now()),
      action: 'received'
    });

    await manifest.save();

    // Update scan session
    await updateScanSession(userId, userName, true);

    // Log successful scan
    await logScanAttempt(userId, userName, trackingNumber, 'success');

    // Generate random delay between 20-40 minutes (in milliseconds)
    const minDelay = 20 * 60 * 1000; // 20 minutes in milliseconds
    const maxDelay = 40 * 60 * 1000; // 40 minutes in milliseconds
    const randomDelay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
    
    console.log(`Waiting ${Math.round(randomDelay / 60000)} minutes before updating to "At Warehouse" for ${trackingNumber}`);
    
    // Schedule the "At Warehouse" update with random delay
    setTimeout(async () => {
      try {
        console.log(`Updating Detrack status to "At Warehouse" for ${trackingNumber} (after ${Math.round(randomDelay / 60000)} minute delay)`);
        const detrackResponse2 = await updateDetrackStatus(trackingNumber, 'At Warehouse');
        
        if (!detrackResponse2.success) {
          console.error('Failed to update Detrack status to "At Warehouse":', detrackResponse2.error);
        } else {
          console.log(`Successfully updated ${trackingNumber} to "At Warehouse"`);
        }
        
        // Add another delay before "In Sorting Area"
        setTimeout(async () => {
          try {
            console.log(`Updating Detrack status to "In Sorting Area" for ${trackingNumber}`);
            const detrackResponse3 = await updateDetrackStatus(trackingNumber, 'In Sorting Area');
            
            if (!detrackResponse3.success) {
              console.error('Failed to update Detrack status to "In Sorting Area":', detrackResponse3.error);
            } else {
              console.log(`Successfully updated ${trackingNumber} to "In Sorting Area"`);
            }
          } catch (error) {
            console.error('Error in delayed "In Sorting Area" update:', error);
          }
        }, 1000); // 1 second delay between At Warehouse and In Sorting Area
        
      } catch (error) {
        console.error('Error in delayed "At Warehouse" update:', error);
      }
    }, randomDelay);

    // Remove the synchronous "At Warehouse" and "In Sorting Area" updates since they're now scheduled
    // Step 2: At Warehouse (now handled asynchronously above)
    // Step 3: In Sorting Area (now handled asynchronously above)
    // Update response structure - only Custom Clearing is immediate, others are scheduled
    res.json({ 
      success: true, 
      message: '✅ Parcel received successfully',
      detrackUpdates: {
        customClearing: detrackResults.customClearing,
        atWarehouse: { 
          success: null, 
          scheduled: true, 
          delayMinutes: Math.round(randomDelay / 60000),
          message: `Scheduled to update in ${Math.round(randomDelay / 60000)} minutes`
        },
        inSortingArea: { 
          success: null, 
          scheduled: true, 
          message: `Scheduled to update after At Warehouse + 1 second`
        }
      },
      parcel: {
        ...manifest.parcels[parcelIndex].toObject(),
        manifestNumber: manifest.manifestNumber
      }
    });

  } catch (err) {
    console.error('Scan error:', err);
    await logScanAttempt(userId, userName, trackingNumber, 'error');
    res.status(500).json({ 
      success: false, 
      message: 'Server error occurred' 
    });
  }
});

async function updateDetrackStatus(trackingNumber, status) {
  try {
    const detrackApiKey = process.env.DETRACK_API_KEY;
    const detrackEndpoint = `https://app.detrack.com/api/v2/dn/jobs/update/?do_number=${trackingNumber}`;
    
    if (!detrackApiKey) {
      console.warn('DETRACK_API_KEY not configured, skipping Detrack update');
      return { success: false, error: 'API key not configured' };
    }
    
    // Map your internal status to Detrack's expected format
    const statusMapping = {
      'At Warehouse': {
        tracking_status: 'At Warehouse',
        status: 'at_warehouse'
      },
      'In Sorting Area': {
        tracking_status: 'In Sorting Area', 
        status: 'in_sorting_area'
      },
      'Custom Clearing': {
        tracking_status: 'Custom Clearing',
        status: 'custom_clearing'
      },
      'Out for Delivery': {
        tracking_status: 'Out for Delivery',
        status: 'out_for_delivery'
      },
      'Delivered': {
        tracking_status: 'Delivered',
        status: 'delivered'
      }
    };

    const mappedStatus = statusMapping[status];
    if (!mappedStatus) {
      console.warn(`Unknown status: ${status}, using default`);
      // Use the original status as fallback
      mappedStatus = {
        tracking_status: status,
        status: status.toLowerCase().replace(/\s+/g, '_')
      };
    }
    
    // Use the correct payload format that Detrack expects
    const payload = {
      do_number: trackingNumber,
      data: {
        tracking_status: mappedStatus.tracking_status,
        status: mappedStatus.status
      },
      timestamp: new Date().toISOString()
    };

    console.log(`Updating Detrack status for ${trackingNumber}:`, payload);
    
    const response = await axios.put(detrackEndpoint, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': detrackApiKey
      }
    });

    console.log(`Detrack update successful for ${trackingNumber}:`, response.data);
    return { success: true, data: response.data };
    
  } catch (error) {
    console.error('Error updating Detrack status:', error);
    
    if (error.response) {
      console.error('Detrack API error response:', error.response.data);
      return { 
        success: false, 
        error: error.response.data?.message || 'Detrack API error',
        details: error.response.data
      };
    } else if (error.request) {
      return { success: false, error: 'No response from Detrack API' };
    } else {
      return { success: false, error: error.message };
    }
  }
}

app.get('/api/manifests/:manifestNumber/scans', async (req, res) => {
  try {
    const manifest = await Manifest.findOne({ 
      manifestNumber: req.params.manifestNumber 
    });

    if (!manifest) {
      return res.status(404).json({ error: 'Manifest not found' });
    }

    // Get all received parcels from this manifest
    const receivedParcels = manifest.parcels.filter(p => p.received);

    // Get scan activity for this manifest
    const scanActivity = [];
    manifest.parcels.forEach(parcel => {
      if (parcel.scanHistory) {
        parcel.scanHistory.forEach(scan => {
          scanActivity.push({
            trackingNumber: parcel.trackingNumber,
            consigneeName: parcel.consigneeName,
            action: scan.action,
            timestamp: scan.timestamp,
            user: scan.userName || scan.userId,
            received: parcel.received
          });
        });
      }
    });

    // Sort by timestamp
    scanActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      success: true,
      manifestNumber: manifest.manifestNumber,
      date: manifest.date,
      totalParcels: manifest.parcels.length,
      receivedParcels: receivedParcels.length,
      scanActivity,
      parcels: manifest.parcels.map(p => ({
        trackingNumber: p.trackingNumber,
        consigneeName: p.consigneeName,
        received: p.received,
        receivedAt: p.receivedAt,
        receivedBy: p.receivedBy
      }))
    });
  } catch (error) {
    console.error('Error fetching manifest scan details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/scan/session', async (req, res) => {
  const { userId, userName, action } = req.body;

  try {
    if (action === 'start') {
      // End any existing active session
      await ScanSession.updateMany(
        { userId: userId, isActive: true },
        { isActive: false, endTime: new Date() }
      );

      // Start new session
      const newSession = new ScanSession({
        userId: userId,
        userName: userName
      });
      await newSession.save();

      res.json({ success: true, message: 'Scanning session started' });
    } else if (action === 'stop') {
      await ScanSession.updateMany(
        { userId: userId, isActive: true },
        { isActive: false, endTime: new Date() }
      );

      res.json({ success: true, message: 'Scanning session ended' });
    } else {
      res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Error managing scan session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function updateScanSession(userId, userName, isSuccessful) {
  try {
    let session = await ScanSession.findOne({ 
      userId: userId, 
      isActive: true 
    });

    if (!session) {
      session = new ScanSession({
        userId: userId,
        userName: userName,
        totalScans: 1,
        successfulScans: isSuccessful ? 1 : 0,
        errorScans: isSuccessful ? 0 : 1
      });
    } else {
      session.totalScans += 1;
      if (isSuccessful) {
        session.successfulScans += 1;
      } else {
        session.errorScans += 1;
      }
      session.userName = userName || session.userName;
    }

    await session.save();
  } catch (error) {
    console.error('Error updating scan session:', error);
  }
}

// Helper function to log scan attempts
async function logScanAttempt(userId, userName, trackingNumber, result) {
  try {
    // You can implement detailed logging here
    console.log(`Scan attempt: ${userName || userId} - ${trackingNumber} - ${result}`);
  } catch (error) {
    console.error('Error logging scan attempt:', error);
  }
}

// Get real-time scanning statistics
app.get('/api/stats/scanning', async (req, res) => {
  try {
    const activeSessions = await ScanSession.find({ isActive: true });
    const totalStats = await ScanSession.aggregate([
      {
        $group: {
          _id: null,
          totalScans: { $sum: '$totalScans' },
          successfulScans: { $sum: '$successfulScans' },
          errorScans: { $sum: '$errorScans' },
          activeUsers: { $sum: { $cond: ['$isActive', 1, 0] } }
        }
      }
    ]);

    res.json({
      success: true,
      stats: {
        activeSessions: activeSessions.length,
        totalScans: totalStats[0]?.totalScans || 0,
        successfulScans: totalStats[0]?.successfulScans || 0,
        errorScans: totalStats[0]?.errorScans || 0,
        activeUsers: activeSessions.map(s => ({
          userId: s.userId,
          userName: s.userName,
          totalScans: s.totalScans,
          successRate: s.totalScans > 0 ? ((s.successfulScans / s.totalScans) * 100).toFixed(1) : 0,
          startTime: s.startTime
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching scanning stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/stats/customers', async (req, res) => {
  try {
    const { manifest: manifestNumber } = req.query;
    
    // Build query for manifests
    const manifestQuery = manifestNumber ? { manifestNumber } : {};
    const manifests = await Manifest.find(manifestQuery);

    if (manifestNumber && manifests.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Manifest not found' 
      });
    }

    const allParcels = [];
    
    manifests.forEach(manifest => {
      manifest.parcels.forEach(parcel => {
        allParcels.push({
          ...parcel.toObject(),
          manifestNumber: manifest.manifestNumber
        });
      });
    });

    const stats = allParcels.reduce((acc, parcel) => {
      const customer = parcel.consigneeName;
      const customerCode = parcel.trackingNumber.substring(0, 3).toUpperCase();
      
      if (!acc[customer]) {
        acc[customer] = {
          _id: customer,
          customerCode: customerCode,
          parcelCount: 0,
          receivedCount: 0,
          lastScanDate: null,
          lastScannedBy: null,
          trackingNumbers: [],
          manifests: new Set() // Track which manifests this customer appears in
        };
      }
      
      acc[customer].parcelCount += 1;
      acc[customer].trackingNumbers.push(parcel.trackingNumber);
      acc[customer].manifests.add(parcel.manifestNumber);
      
      if (parcel.received) {
        acc[customer].receivedCount += 1;
        if (parcel.receivedAt && (!acc[customer].lastScanDate || parcel.receivedAt > acc[customer].lastScanDate)) {
          acc[customer].lastScanDate = parcel.receivedAt;
          acc[customer].lastScannedBy = parcel.scannedByUser || parcel.receivedBy;
        }
      }
      
      return acc;
    }, {});

    // Convert the stats object to an array and transform the Set to an array
    const sortedStats = Object.values(stats)
      .map(stat => ({
        ...stat,
        manifests: Array.from(stat.manifests) // Convert Set to array
      }))
      .sort((a, b) => b.parcelCount - a.parcelCount);

    res.json({ 
      success: true, 
      stats: sortedStats,
      manifestFilter: manifestNumber || 'all' 
    });
  } catch (error) {
    console.error('Error fetching customer stats:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

app.get('/api/activity', async (req, res) => {
  try {
    const { limit = 50, userId } = req.query;
    
    const manifests = await Manifest.find();
    const activities = [];
    
    manifests.forEach(manifest => {
      manifest.parcels.forEach(parcel => {
        if (parcel.scanHistory && parcel.scanHistory.length > 0) {
          parcel.scanHistory.forEach(scan => {
            if (!userId || scan.userId === userId) {
              activities.push({
                trackingNumber: parcel.trackingNumber,
                consigneeName: parcel.consigneeName,
                userId: scan.userId,
                userName: scan.userName,
                timestamp: scan.timestamp,
                action: scan.action,
                manifestNumber: manifest.manifestNumber
              });
            }
          });
        }
      });
    });

    // Sort by timestamp (newest first) and limit
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const limitedActivities = activities.slice(0, parseInt(limit));

    res.json({ success: true, activities: limitedActivities });
  } catch (error) {
    console.error('Error fetching activity log:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// === GET ALL MANIFESTS ROUTE ===
app.get('/api/manifests', async (req, res) => {
  try {
    const manifests = await Manifest.find().sort({ createdAt: -1 });
    res.json({ success: true, manifests });
  } catch (error) {
    console.error('Error fetching manifests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/manifests/scan-stats', async (req, res) => {
  try {
    const manifests = await Manifest.aggregate([
      {
        $project: {
          manifestNumber: 1,
          date: 1,
          totalParcels: { $size: "$parcels" },
          receivedParcels: {
            $size: {
              $filter: {
                input: "$parcels",
                as: "parcel",
                cond: { $eq: ["$$parcel.received", true] }
              }
            }
          }
        }
      },
      { $sort: { date: -1 } }
    ]);

    res.json({ success: true, manifests });
  } catch (error) {
    console.error('Error fetching manifest stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// === GET SINGLE MANIFEST ROUTE ===
app.get('/api/manifests/:manifestNumber', async (req, res) => {
  try {
    const manifest = await Manifest.findOne({ manifestNumber: req.params.manifestNumber });
    
    if (!manifest) {
      return res.status(404).json({ error: 'Manifest not found' });
    }

    res.json({ success: true, manifest });
  } catch (error) {
    console.error('Error fetching manifest:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// === GET ALL PARCELS ROUTE (from all manifests) ===
app.get('/api/parcels', async (req, res) => {
  try {
    const manifests = await Manifest.find();
    const allParcels = [];
    
    // Flatten all parcels from all manifests
    manifests.forEach(manifest => {
      manifest.parcels.forEach(parcel => {
        allParcels.push({
          ...parcel.toObject(),
          manifestNumber: manifest.manifestNumber,
          manifestDate: manifest.date
        });
      });
    });
    
    // Sort by creation date (newest first)
    allParcels.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({ success: true, parcels: allParcels });
  } catch (error) {
    console.error('Error fetching parcels:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// === GET SINGLE PARCEL ROUTE (search across all manifests) ===
app.get('/api/parcels/:trackingNumber', async (req, res) => {
  try {
    const manifest = await Manifest.findOne({ 
      'parcels.trackingNumber': req.params.trackingNumber 
    });
    
    if (!manifest) {
      return res.status(404).json({ error: 'Parcel not found' });
    }

    const parcel = manifest.parcels.find(
      p => p.trackingNumber === req.params.trackingNumber
    );

    if (!parcel) {
      return res.status(404).json({ error: 'Parcel not found' });
    }

    res.json({ 
      success: true, 
      parcel: {
        ...parcel.toObject(),
        manifestNumber: manifest.manifestNumber,
        manifestDate: manifest.date
      }
    });
  } catch (error) {
    console.error('Error fetching parcel:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// === DELETE MANIFEST ROUTE ===
app.delete('/api/manifests/:manifestNumber', async (req, res) => {
  try {
    const manifest = await Manifest.findOneAndDelete({ 
      manifestNumber: req.params.manifestNumber 
    });
    
    if (!manifest) {
      return res.status(404).json({ error: 'Manifest not found' });
    }

    res.json({ 
      success: true, 
      message: `Manifest ${req.params.manifestNumber} deleted successfully` 
    });
  } catch (error) {
    console.error('Error deleting manifest:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/health', async (req, res) => {
  try {
    // Check database connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Get active sessions count
    const activeSessions = await ScanSession.countDocuments({ isActive: true });
    
    // Get recent scan activity (last 5 minutes)
    const recentActivity = await ScanSession.countDocuments({
      $or: [
        { startTime: { $gte: new Date(Date.now() - 5 * 60 * 1000) } },
        { updatedAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) } }
      ]
    });

    res.json({ 
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      activeScanners: activeSessions,
      recentActivity: recentActivity,
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// === START SERVER ===
const PORT = process.env.PORT || 3030;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});