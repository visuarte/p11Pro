import { randomUUID } from 'node:crypto';
import { Router, type Request, type Response } from 'express';
import type { QueryResultRow } from 'pg';
import { queryPostgres } from '../db/postgres';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();

interface RenderProjectRow extends QueryResultRow {
  id: string;
  name: string;
}

interface RenderAssetRow extends QueryResultRow {
  id: string;
  created_at: Date | string;
}

function normalizeCanvasData(canvasData: unknown): string {
  if (typeof canvasData === 'string') {
    return canvasData;
  }

  return JSON.stringify(canvasData ?? {});
}

router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { projectId, canvasData, options, metadata } = req.body as {
      projectId?: string;
      canvasData?: unknown;
      options?: {
        width?: number;
        height?: number;
        format?: string;
        quality?: number;
        includeAlpha?: boolean;
        colorProfile?: string;
      };
      metadata?: Record<string, unknown>;
    };

    if (!projectId || canvasData === undefined || !options?.format) {
      throw new AppError(
        'projectId, canvasData and options.format are required',
        400,
        'MISSING_RENDER_FIELDS'
      );
    }

    const width = Number(options.width ?? 0);
    const height = Number(options.height ?? 0);

    if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
      throw new AppError(
        'options.width and options.height must be positive numbers',
        400,
        'INVALID_RENDER_DIMENSIONS'
      );
    }

    const projectResult = await queryPostgres<RenderProjectRow>(
      'SELECT id, name FROM kolicode.projects WHERE id = $1 LIMIT 1',
      [projectId]
    );

    const project = projectResult.rows[0];

    if (!project) {
      throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
    }

    const serializedCanvas = normalizeCanvasData(canvasData);
    const format = String(options.format).toLowerCase();
    const assetName = `${project.name}-render-${Date.now()}.${format}`;
    const fallbackRequestId = randomUUID();

    const assetResult = await queryPostgres<RenderAssetRow>(
      `
        INSERT INTO kolicode.assets (
          project_id,
          name,
          asset_type,
          format,
          status,
          metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6::jsonb)
        RETURNING id, created_at
      `,
      [
        project.id,
        assetName,
        'rendered',
        format,
        'completed',
        JSON.stringify({
          fallbackMode: 'rest',
          requestId: fallbackRequestId,
          renderOptions: {
            width,
            height,
            quality: options.quality ?? 90,
            includeAlpha: options.includeAlpha ?? true,
            colorProfile: options.colorProfile ?? 'srgb',
          },
          canvasBytes: Buffer.byteLength(serializedCanvas),
          metadata: metadata ?? {},
        }),
      ]
    );

    const asset = assetResult.rows[0];

    logger.info({
      message: 'Handled render request through REST fallback',
      projectId,
      assetId: asset.id,
      requestId: fallbackRequestId,
      format,
    });

    res.status(202).json({
      accepted: true,
      fallbackMode: 'rest',
      requestId: fallbackRequestId,
      asset: {
        id: asset.id,
        name: assetName,
        projectId: project.id,
        format,
        status: 'completed',
        createdAt:
          asset.created_at instanceof Date
            ? asset.created_at.toISOString()
            : String(asset.created_at),
      },
      renderRequest: {
        projectId,
        options: {
          width,
          height,
          format,
          quality: options.quality ?? 90,
          includeAlpha: options.includeAlpha ?? true,
          colorProfile: options.colorProfile ?? 'srgb',
        },
        canvasBytes: Buffer.byteLength(serializedCanvas),
      },
    });
  })
);

export default router;
