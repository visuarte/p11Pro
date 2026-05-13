import Redis from 'ioredis';
// Logger utilitario, reemplaza por tu logger real si es necesario
const logger = console;

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times: number) => {
    // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
    const delay = Math.min(1000 * Math.pow(2, times), 30000);
    logger.warn(`Redis reconnect attempt #${times}, retrying in ${delay}ms`);
    return delay;
  },
  maxRetriesPerRequest: 5
});

redis.on('error', (err) => {
  logger.error(`Redis error: ${err.message}`);
});

redis.on('reconnecting', () => {
  logger.warn('Redis reconnecting...');
});

export default redis;

