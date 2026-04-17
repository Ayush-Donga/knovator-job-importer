import nodeCron from 'node-cron';
import { importQueue } from '../queues/index.js';

const FEED_URLS = [
  'https://jobicy.com/?feed=job_feed',
  'https://jobicy.com/?feed=job_feed&job_categories=smm&job_types=full-time',
  'https://jobicy.com/?feed=job_feed&job_categories=seller&job_types=full-time&search_region=france',
  'https://jobicy.com/?feed=job_feed&job_categories=design-multimedia',
  'https://jobicy.com/?feed=job_feed&job_categories=data-science',
  'https://jobicy.com/?feed=job_feed&job_categories=copywriting',
  'https://jobicy.com/?feed=job_feed&job_categories=business',
  'https://jobicy.com/?feed=job_feed&job_categories=management',
  'https://www.higheredjobs.com/rss/articleFeed.cfm'
];

export const initCronJobs = () => {
  // Run every hour
  nodeCron.schedule('0 * * * *', async () => {
    console.log('[Cron] Triggering hourly job import...');
    for (const url of FEED_URLS) {
      await importQueue.add(`import-${new Date().getTime()}`, { url });
    }
  });

  console.log('[Cron] Hourly job import scheduled.');
};

/**
 * Helper to trigger imports manually on startup if needed
 */
export const triggerManualImport = async () => {
    console.log('[Manual] Triggering manual job import on startup...');
    for (const url of FEED_URLS) {
      await importQueue.add(`manual-import-${new Date().getTime()}`, { url });
    }
}
