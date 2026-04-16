import { Queue } from 'bullmq';
import { redisConfig, QUEUE_NAMES, defaultJobOptions } from '../config/queue';

export const importQueue = new Queue(QUEUE_NAMES.IMPORT, {
  connection: redisConfig,
  defaultJobOptions,
});

export const jobUpsertQueue = new Queue(QUEUE_NAMES.JOB_UPSERT, {
  connection: redisConfig,
  defaultJobOptions,
});
