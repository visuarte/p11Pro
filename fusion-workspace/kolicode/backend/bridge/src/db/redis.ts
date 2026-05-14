import Redis from 'ioredis';
import type { ServiceHealthStatus } from './postgres';

let redisClient: Redis | null = null;

function getRedisUrl(): string {
  return process.env.REDIS_URL ?? 'redis://localhost:6379';
}

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(getRedisUrl(), {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
    });
  }

  return redisClient;
}

export async function checkRedisHealth(): Promise<ServiceHealthStatus> {
  const startedAt = Date.now();
  const client = getRedisClient();

  try {
    if (client.status === 'wait') {
      await client.connect();
    }

    const result = await client.ping();

    return {
      status: result === 'PONG' ? 'healthy' : 'unhealthy',
      latencyMs: Date.now() - startedAt,
      details: result === 'PONG' ? undefined : `Unexpected Redis ping response: ${result}`,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      latencyMs: Date.now() - startedAt,
      details: error instanceof Error ? error.message : 'Unknown Redis error',
    };
  }
}

export async function closeRedisClient(): Promise<void> {
  if (!redisClient) {
    return;
  }

  await redisClient.quit();
  redisClient = null;
}
