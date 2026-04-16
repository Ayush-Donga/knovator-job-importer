import { ConnectionOptions } from 'bullmq';
import { Redis } from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// Create a singleton connection with better stability for slow networks
const redisUrl = process.env.REDIS_URL?.replace(/"/g, ''); // Clear any accidentally added quotes

export const redisConnection = new Redis(redisUrl || {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379'),
}, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  enableOfflineQueue: true, // Re-enable temporarily for stability if connection is flickery
});

export const redisConfig = redisConnection;

export const QUEUE_NAMES = {
  IMPORT: 'import-queue',
  JOB_UPSERT: 'job-upsert-queue',
};

export const defaultJobOptions = {
  attempts: 1,
  removeOnComplete: true,
  removeOnFail: true,
};

// EXTREME OPTIMIZATION for Upstash/Free Quotas
export const workerSettings = {
  connection: redisConnection,
  lockDuration: 300000, // 5 minutes
  stalledInterval: 300000, // 5 minutes (reduces "stalled job" commands significantly)
  maxStalledCount: 0, // Disable stalled job checking to save commands
  drainDelay: 60, // Wait 60 seconds before checking Redis if queue is empty
};
