import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { initCronJobs, triggerManualImport } from './services/CronService';
import './workers/importWorker';
import './workers/jobUpsertWorker';
import ImportLog from './models/ImportLog';

import http from 'http';
import SocketService from './services/SocketService';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize Socket.io
SocketService.init(server);

// --- API Routes ---

// Get Import History with Pagination
app.get('/api/logs', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 50));
    const status = req.query.status as string;
    
    const query = status ? { status } : {};
    
    // Add logging to debug
    console.log(`[API] Fetching logs: page=${page}, limit=${limit}, status=${status || 'all'}`);
    
    const total = await ImportLog.countDocuments(query);
    const logs = await ImportLog.find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
      
    res.json({
      logs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('[API Error] Failed to fetch logs:', error);
    res.status(500).json({ error: error.message });
  }
});

// Trigger a manual sync
app.post('/api/sync', async (req, res) => {
  try {
     await triggerManualImport();
    res.json({ message: 'Sync started successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get Overall Stats
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await ImportLog.aggregate([
      {
        $group: {
          _id: null,
          totalFetched: { $sum: '$totalFetched' },
          totalNew: { $sum: '$newJobs' },
          totalUpdated: { $sum: '$updatedJobs' },
          totalSyncs: { $sum: 1 }
        }
      }
    ]);
    
    const result = stats[0] || { totalFetched: 0, totalNew: 0, totalUpdated: 0, totalSyncs: 0 };
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/clean-db', async (req, res) => {
  try {
    const Job = mongoose.model('Job');
    const ImportLog = mongoose.model('ImportLog');
    await Job.deleteMany({});
    await ImportLog.deleteMany({});
    res.json({ message: 'Database cleaned successfully! Now run Sync again.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

    const start = async () => {
      console.log('Starting server initialization...');
      try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/job-importer');
        console.log('Connected to MongoDB successfully');

        initCronJobs();
        
        // Manual/Cron-only sync to preserve Redis quota
        console.log('[Info] Auto-sync scheduled. Manual sync available via dashboard.');

        server.listen(Number(PORT), '0.0.0.0', () => {
          console.log(`Server running on http://0.0.0.0:${PORT}`);
        });
      } catch (error) {
        console.error('Error during server startup:', error);
        process.exit(1);
      }
    };

start();
