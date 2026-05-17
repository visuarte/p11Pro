import { Router, Request, Response } from 'express';
import { queryPostgres } from '../db/postgres';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();

/**
 * Check if a given path is whitelisted.
 * @param path The absolute path to check.
 * @returns Promise<boolean> true if the path is whitelisted, false otherwise.
 */
async function isPathWhitelisted(path: string): Promise<boolean> {
  try {
    const result = await queryPostgres<{ count: string }>(
      `SELECT COUNT(*) FROM kolicode.whitelisted_directories WHERE $1 LIKE directory_path || '%' AND is_active = TRUE`,
      [path]
    );
    return parseInt(result.rows[0].count) > 0;
  } catch (error) {
    logger.error({
      message: 'Error checking whitelist',
      error: error instanceof Error ? error.message : error,
    });
    // In case of error, we fail closed (not whitelisted) for security
    return false;
  }
}

/**
 * GET /api/projects/resolve/:id
 * Resolve a project ID to its absolute path for UniversalEngine consumption
 */
router.get('/resolve/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  logger.debug({
    message: 'Resolving project path',
    projectId: id,
  });

  // Validate UUID format
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(id)) {
    throw new AppError('Invalid project ID format', 400, 'INVALID_PROJECT_ID');
  }

  const result = await queryPostgres<{ absolute_path: string; status: string }>(
    `
      SELECT 
        absolute_path,
        status
      FROM kolicode.projects
      WHERE id = $1
    `,
    [id]
  );

  const project = result.rows[0];

  if (!project) {
    throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
  }

  // Security check: Verify the path is whitelisted
  const isWhitelisted = await isPathWhitelisted(project.absolute_path);
  if (!isWhitelisted) {
    throw new AppError('Project path is not whitelisted', 403, 'PATH_NOT_WHITELISTED');
  }

  // Check if project is active
  if (project.status !== 'active') {
    throw new AppError(`Project is not active (status: ${project.status})`, 400, 'PROJECT_NOT_ACTIVE');
  }

  res.status(200).json({
    projectId: id,
    absolutePath: project.absolute_path,
    status: project.status
  });
}));

/**
 * GET /api/projects/resolve/alias/:alias
 * Resolve a project alias to its absolute path
 */
router.get('/resolve/alias/:alias', asyncHandler(async (req: Request, res: Response) => {
  const { alias } = req.params;

  logger.debug({
    message: 'Resolving project path by alias',
    projectAlias: alias,
  });

  const result = await queryPostgres<{ id: string, absolute_path: string, status: string }>(
    `
      SELECT 
        id,
        absolute_path,
        status
      FROM kolicode.projects
      WHERE internal_alias = $1
    `,
    [alias]
  );

  const project = result.rows[0];

  if (!project) {
    throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
  }

  // Security check: Verify the path is whitelisted
  const isWhitelisted = await isPathWhitelisted(project.absolute_path);
  if (!isWhitelisted) {
    throw new AppError('Project path is not whitelisted', 403, 'PATH_NOT_WHITELISTED');
  }

  // Check if project is active
  if (project.status !== 'active') {
    throw new AppError(`Project is not active (status: ${project.status})`, 400, 'PROJECT_NOT_ACTIVE');
  }

  res.status(200).json({
    projectId: project.id,
    absolutePath: project.absolute_path,
    status: project.status
  });
}));

export default router;