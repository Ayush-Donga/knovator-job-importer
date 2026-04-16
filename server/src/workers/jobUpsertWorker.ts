import { Worker, Job as BullJob } from 'bullmq';
import { redisConfig, QUEUE_NAMES, workerSettings } from '../config/queue';
import Job from '../models/Job';
import ImportLog from '../models/ImportLog';
import SocketService from '../services/SocketService';

export const jobUpsertWorker = new Worker(
  QUEUE_NAMES.JOB_UPSERT,
  async (bullJob: BullJob) => {
    const { mappedJobs, logId } = bullJob.data; // mappedJobs is now an array

    if (!Array.isArray(mappedJobs) || mappedJobs.length === 0) return;

    try {
      // 1. Find which jobs already exist to differentiate New vs Updated
      const urls = mappedJobs.map((j: any) => j.url);
      const existingJobs = await Job.find({ url: { $in: urls } }).select('url');
      const existingUrls = new Set(existingJobs.map(j => j.url));

      let newCount = 0;
      let updatedCount = 0;

      // 2. Prepare Bulk Operations
      const operations = mappedJobs.map((mj: any) => {
        if (existingUrls.has(mj.url)) {
          updatedCount++;
        } else {
          newCount++;
        }

        return {
          updateOne: {
            filter: { url: mj.url },
            update: { $set: mj },
            upsert: true,
          },
        };
      });

      // 3. Execute Bulk Write
      await Job.bulkWrite(operations);

      // 4. Update Log counter using a single atomic increment for the whole batch
      const updatedLog = await ImportLog.findByIdAndUpdate(logId, {
        $inc: {
          totalImported: mappedJobs.length,
          newJobs: newCount,
          updatedJobs: updatedCount,
        },
      }, { new: true });

      // Emit real-time update
      if (updatedLog) {
        SocketService.emit('log_update', updatedLog);
      }

      // Simple completion check
      if (updatedLog && (updatedLog.totalImported + updatedLog.failedJobs) >= updatedLog.totalFetched) {
         const finalLog = await ImportLog.findByIdAndUpdate(logId, { status: 'completed' }, { new: true });
         if (finalLog) SocketService.emit('log_update', finalLog);
      }

    } catch (error: any) {
      console.error(`[JobUpsertWorker] Batch failed: ${error.message}`);
      
      const updatedLog = await ImportLog.findByIdAndUpdate(logId, {
        $inc: { failedJobs: mappedJobs.length },
        $push: { errorDetails: `Batch Error: ${error.message}` },
      }, { new: true });

      if (updatedLog) {
         SocketService.emit('log_update', updatedLog);
      }
      
      throw error;
    }
  },
  { 
    ...workerSettings,
    concurrency: parseInt(process.env.CONCURRENCY_UPSERT || '10')
  }
);
