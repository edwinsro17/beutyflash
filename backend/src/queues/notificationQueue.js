/**
 * Cola en segundo plano con BullMQ + Redis (con fallback seguro si Redis no está encendido en desarrollo).
 */
let notificationQueue = null;
try {
  if (process.env.REDIS_URL) {
    const { Queue } = require('bullmq');
    const IORedis = require('ioredis');
    const connection = new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
    notificationQueue = new Queue('beautyflash-notifications', { connection });
  }
} catch (_e) {}

async function enqueueNotificationJob(payload) {
  if (notificationQueue) {
    return await notificationQueue.add('dispatch-notification', payload, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    });
  }
  return { queued: false, fallback: true, payload };
}

module.exports = { notificationQueue, enqueueNotificationJob };
