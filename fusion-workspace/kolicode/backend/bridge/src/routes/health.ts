import { Router, Request, Response } from 'express';
import { getDiagnosticsStoreStatus } from '../diagnostics/store';
import { checkPostgresHealth } from '../db/postgres';
import { checkRedisHealth } from '../db/redis';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Health check endpoint
 * Returns 200 if service is healthy
 */
router.get('/', (req: Request, res: Response) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();

  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(uptime)}s`,
    memory: {
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
    },
    service: {
      name: 'bridge',
      version: '0.1.0',
      environment: process.env.NODE_ENV || 'development',
    },
  });
});

/**
 * Readiness check endpoint
 * Indicates if service is ready to receive traffic
 */
router.get('/ready', async (req: Request, res: Response) => {
  const [database, redis] = await Promise.all([
    checkPostgresHealth(),
    checkRedisHealth(),
  ]);
  const isReady = database.status === 'healthy' && redis.status === 'healthy';

  if (isReady) {
    res.status(200).json({
      ready: true,
      timestamp: new Date().toISOString(),
      services: {
        database,
        redis,
      },
    });
  } else {
    res.status(503).json({
      ready: false,
      timestamp: new Date().toISOString(),
      message: 'Service not ready',
      services: {
        database,
        redis,
      },
    });
  }
});

/**
 * Liveness check endpoint
 * Indicates if service is alive and should not be restarted
 */
router.get('/alive', (req: Request, res: Response) => {
  res.status(200).json({
    alive: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * Detailed health check endpoint
 * Returns comprehensive health information
 */
router.get('/detailed', async (req: Request, res: Response) => {
  const memoryUsage = process.memoryUsage();
  const uptime = process.uptime();
  const [database, redis, diagnostics] = await Promise.all([
    checkPostgresHealth(),
    checkRedisHealth(),
    getDiagnosticsStoreStatus(),
  ]);

  res.status(200).json({
    status:
      database.status === 'healthy' &&
      redis.status === 'healthy' &&
      diagnostics.status === 'healthy'
        ? 'healthy'
        : 'degraded',
    timestamp: new Date().toISOString(),
    uptime,
    memory: memoryUsage,
    process: {
      pid: process.pid,
      platform: process.platform,
      version: process.version,
      versions: process.versions,
    },
    services: {
      database,
      redis,
      diagnostics,
      thunderkoli: {
        status: 'unknown', // To be implemented
        latency: null,
      },
      universalengine: {
        status: 'unknown', // To be implemented
        latency: null,
      },
      designstudio: {
        status: 'unknown', // To be implemented
        latency: null,
      },
    },
  });
});

export default router;
