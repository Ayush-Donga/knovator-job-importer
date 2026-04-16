import { Worker, Job as BullJob } from 'bullmq';
import { redisConfig, QUEUE_NAMES, workerSettings } from '../config/queue';
import RSSService from '../services/RSSService';
import ImportLog from '../models/ImportLog';
import { jobUpsertQueue } from '../queues';
import SocketService from '../services/SocketService';

export const importWorker = new Worker(
  QUEUE_NAMES.IMPORT,
  async (job: BullJob) => {
    const { url } = job.data;
    console.log(`[ImportWorker] Starting import for: ${url}`);
    
    SocketService.emit('import_start', { url, timestamp: new Date() });

    try {
      // 1. Initialize Log
      const log = await ImportLog.create({
        fileName: url,
        status: 'pending',
        timestamp: new Date(),
      });

      // 2. Fetch Jobs
      const rawJobs = await RSSService.fetchAndParse(url);
      
      const updatedLog = await ImportLog.findByIdAndUpdate(log._id, {
        totalFetched: rawJobs.length,
      }, { new: true });

      if (updatedLog) SocketService.emit('log_update', updatedLog);

      // 3. Batch jobs and dispatch
      const batchSize = parseInt(process.env.BATCH_SIZE || '100');
      const jobChunks = [];
      for (let i = 0; i < rawJobs.length; i += batchSize) {
        jobChunks.push(rawJobs.slice(i, i + batchSize));
      }

      const batchPromises = jobChunks.map((chunk, index) => {
        const mappedJobs = chunk.map((rj: any) => RSSService.mapToJobFormat(rj, url));
        return jobUpsertQueue.add(`batch-upsert-${log._id}-${index}`, {
          mappedJobs,
          logId: log._id,
        });
      });

      await Promise.all(batchPromises);
      
      console.log(`[ImportWorker] Dispatched ${rawJobs.length} jobs for ${url}`);
      return { logId: log._id, count: rawJobs.length };
    } catch (error: any) {
      console.error(`[ImportWorker] Failed: ${error.message}`);
      throw error;
    }
  },
  { 
    ...workerSettings, 
    concurrency: parseInt(process.env.CONCURRENCY_IMPORT || '1') 
  }
);
