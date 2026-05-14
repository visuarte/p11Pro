import { Request, Response, NextFunction } from 'express';
import { recordDiagnosticInBackground } from '../diagnostics/store';
import { logger } from '../utils/logger';

/**
 * Request logging middleware
 * Logs incoming HTTP requests with method, path, duration, and status
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now();

  // Log request
  logger.debug({
    message: 'Incoming request',
    method: req.method,
    path: req.path,
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Capture response finish
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    const logLevel =
      statusCode >= 500 ? 'error' :
      statusCode >= 400 ? 'warn' :
      statusCode >= 300 ? 'info' :
      'debug';

    (logger as any)[logLevel]({
      message: 'Response sent',
      method: req.method,
      path: req.path,
      statusCode,
      duration: `${duration}ms`,
    });

    if (statusCode >= 400) {
      recordDiagnosticInBackground({
        type: 'http-response',
        source: 'bridge.requestLogger',
        level: statusCode >= 500 ? 'error' : 'warn',
        message: `HTTP ${statusCode} response for ${req.method} ${req.path}`,
        metadata: {
          method: req.method,
          path: req.path,
          statusCode,
          durationMs: duration,
        },
      });
    }
  });

  next();
};
