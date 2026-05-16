import { randomUUID } from 'node:crypto';
import { Router, type Request, type Response } from 'express';
import {
  buildDiagnosticCapture,
  recordDiagnostic,
} from '../diagnostics/store';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();

router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { type, source, level, message, metadata } = req.body as {
      type?: string;
      source?: string;
      level?: 'info' | 'warn' | 'error';
      message?: string;
      metadata?: Record<string, unknown>;
    };

    if (!type || !source || !level || !message) {
      throw new AppError(
        'type, source, level and message are required',
        400,
        'MISSING_DIAGNOSTIC_FIELDS'
      );
    }

    const allowedLevels = new Set(['info', 'warn', 'error']);

    if (!allowedLevels.has(level)) {
      throw new AppError(
        'level must be one of: info, warn, error',
        400,
        'INVALID_DIAGNOSTIC_LEVEL'
      );
    }

    const diagnosticId = randomUUID();
    const createdAt = new Date().toISOString();
    const enrichedMetadata = {
      ...(metadata ?? {}),
      diagnosticId,
      transport: 'rest-fallback',
    };

    const capture = buildDiagnosticCapture(
      {
        type,
        source,
        level,
        message,
        metadata: enrichedMetadata,
      },
      createdAt
    );

    await recordDiagnostic({
      type,
      source,
      level,
      message,
      metadata: enrichedMetadata,
      capture,
    });

    logger.info({
      message: 'Captured diagnostic through REST fallback',
      diagnosticId,
      type,
      source,
      level,
    });

    res.status(202).json({
      accepted: true,
      fallbackMode: 'rest',
      diagnosticId,
      recordedAt: createdAt,
      capture,
    });
  })
);

export default router;
