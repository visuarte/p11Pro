import { Router, Request, Response } from 'express';
import { queryPostgres } from '../db/postgres';
import { getRedisClient } from '../db/redis';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();

// Cache TTL in seconds (5 minutes)
const PROJECTS_CACHE_TTL = 300;
const PROJECTS_CACHE_KEY = 'kolicode:projects:list';

interface ProjectResponse {
  id: string;
  internalAlias: string;
  displayName: string;
  absolutePath: string;
  status: string;
  engineConfig: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

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
 * Get projects from cache or database.
 * @returns Promise<ProjectResponse[]> list of projects
 */
async function getProjectsWithCache(): Promise<ProjectResponse[]> {
  const redis = getRedisClient();
  
  // Try to get from cache first
  try {
    const cached = await redis.get(PROJECTS_CACHE_KEY);
    if (cached) {
      logger.debug({ message: 'Cache hit for projects list' });
      return JSON.parse(cached);
    }
  } catch (error) {
    logger.warn({
      message: 'Error reading from Redis cache, falling back to database',
      error: error instanceof Error ? error.message : error,
    });
    // Continue to database query
  }
  
  // If not in cache, get from database
  logger.debug({ message: 'Cache miss for projects list, querying database' });
  const result = await queryPostgres<ProjectResponse>(
    `
      SELECT 
        id,
        internal_alias,
        display_name,
        absolute_path,
        status,
        engine_config,
        created_at,
        updated_at
      FROM kolicode.projects
      ORDER BY created_at DESC
    `
  );
  
  // Store in cache
  try {
    const projectsJson = JSON.stringify(result.rows);
    await redis.setex(PROJECTS_CACHE_KEY, PROJECTS_CACHE_TTL, projectsJson);
    logger.debug({ message: 'Projects list cached successfully' });
  } catch (error) {
    logger.warn({
      message: 'Error writing to Redis cache',
      error: error instanceof Error ? error.message : error,
    });
    // Continue without caching
  }
  
  return result.rows;
}

/**
 * Invalidate the projects cache.
 * This should be called after any project creation, update, or deletion.
 */
async function invalidateProjectsCache() {
  const redis = getRedisClient();
  try {
    await redis.del(PROJECTS_CACHE_KEY);
    logger.debug({ message: 'Projects cache invalidated' });
  } catch (error) {
    logger.warn({
      message: 'Error invalidating Redis cache',
      error: error instanceof Error ? error.message : error,
    });
  }
}

/**
 * GET /api/projects
 * List all projects from the kolicode schema with Redis caching
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  logger.debug({
    message: 'Listing projects from kolicode schema with caching',
    query: req.query,
  });

  // Get optional query parameters for filtering
  const { status, limit = '100', offset = '0' } = req.query;
  
  // For filtered requests, we bypass the cache and go directly to database
  // For unfiltered requests, we use the cache
  if (!status) {
    // Use cached list for unfiltered requests
    const allProjects = await getProjectsWithCache();
    
    // Apply pagination
    const start = parseInt(offset as string);
    const end = start + parseInt(limit as string);
    const paginatedProjects = allProjects.slice(start, end);
    
    res.status(200).json({
      projects: paginatedProjects,
      pagination: {
        total: allProjects.length,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    });
  } else {
    // For filtered queries, go directly to database
    logger.debug({
      message: 'Listing projects with status filter (bypassing cache)',
      query: req.query,
    });

    // Build query with optional filters
    let query = `
      SELECT 
        id,
        internal_alias,
        display_name,
        absolute_path,
        status,
        engine_config,
        created_at,
        updated_at
      FROM kolicode.projects
    `;
    
    const params: unknown[] = [];
    
    if (status) {
      query += ' WHERE status = $1';
      params.push(status);
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit as string), parseInt(offset as string));

    const result = await queryPostgres<ProjectResponse>(query, params);
    
    // Get total count for pagination
    const countQuery = status 
      ? 'SELECT COUNT(*) FROM kolicode.projects WHERE status = $1'
      : 'SELECT COUNT(*) FROM kolicode.projects';
      
    const countParams = status ? [status] : [];
    const countResult = await queryPostgres<{ count: string }>(countQuery, countParams);
    
    res.status(200).json({
      projects: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    });
  }
}));

/**
 * GET /api/projects/count
 * Get total count of projects
 */
router.get('/count', asyncHandler(async (req: Request, res: Response) => {
  logger.debug({ message: 'Getting project count' });
  
  const result = await queryPostgres<{ count: string }>(
    'SELECT COUNT(*) FROM kolicode.projects'
  );
  
  res.status(200).json({
    count: parseInt(result.rows[0].count)
  });
}));

/**
 * GET /api/projects/:id
 * Get a specific project by UUID
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  logger.debug({
    message: 'Fetching project by ID',
    projectId: id,
  });

  // Validate UUID format
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(id)) {
    throw new AppError('Invalid project ID format', 400, 'INVALID_PROJECT_ID');
  }

  const result = await queryPostgres<ProjectResponse>(
    `
      SELECT 
        id,
        internal_alias,
        display_name,
        absolute_path,
        status,
        engine_config,
        created_at,
        updated_at
      FROM kolicode.projects
      WHERE id = $1
    `,
    [id]
  );

  const project = result.rows[0];

  if (!project) {
    throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
  }

  res.status(200).json(project);
}));

/**
 * GET /api/projects/alias/:alias
 * Get a project by its internal alias
 */
router.get('/alias/:alias', asyncHandler(async (req: Request, res: Response) => {
  const { alias } = req.params;

  logger.debug({
    message: 'Fetching project by alias',
    projectAlias: alias,
  });

  const result = await queryPostgres<ProjectResponse>(
    `
      SELECT 
        id,
        internal_alias,
        display_name,
        absolute_path,
        status,
        engine_config,
        created_at,
        updated_at
      FROM kolicode.projects
      WHERE internal_alias = $1
    `,
    [alias]
  );

  const project = result.rows[0];

  if (!project) {
    throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
  }

  res.status(200).json(project);
}));

/**
 * POST /api/projects
 * Create a new project
 */
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { internal_alias, display_name, absolute_path, status, engine_config } = req.body;

  // Validate required fields
  if (!internal_alias || !display_name || !absolute_path) {
    return res.status(400).json({
      error: {
        message: 'internal_alias, display_name, and absolute_path are required',
        code: 'MISSING_REQUIRED_FIELDS',
      },
    });
  }

  // Validate that the absolute_path is whitelisted
  const isWhitelisted = await isPathWhitelisted(absolute_path);
  if (!isWhitelisted) {
    return res.status(403).json({
      error: {
        message: 'Project path is not whitelisted',
        code: 'PATH_NOT_WHITELISTED',
      },
    });
  }

  logger.info({
    message: 'Creating new project',
    internal_alias,
    display_name,
  });

  // Insert the new project
  const result = await queryPostgres<{ id: string }>(
    `
      INSERT INTO kolicode.projects 
        (internal_alias, display_name, absolute_path, status, engine_config)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `,
    [
      internal_alias,
      display_name,
      absolute_path,
      status || 'active',
      engine_config ? JSON.stringify(engine_config) : null
    ]
  );

  const newProjectId = result.rows[0].id;

  // Invalidate cache after creation
  await invalidateProjectsCache();

  // Fetch and return the created project
  const createdProject = await queryPostgres<ProjectResponse>(
    `
      SELECT 
        id,
        internal_alias,
        display_name,
        absolute_path,
        status,
        engine_config,
        created_at,
        updated_at
      FROM kolicode.projects
      WHERE id = $1
    `,
    [newProjectId]
  );

  res.status(201).json(createdProject.rows[0]);
}));

/**
 * PUT /api/projects/:id
 * Update a project
 */
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { internal_alias, display_name, absolute_path, status, engine_config } = req.body;

  logger.info({
    message: 'Updating project',
    projectId: id,
    updates: { internal_alias, display_name, absolute_path, status, engine_config },
  });

  // Validate UUID format
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(id)) {
    throw new AppError('Invalid project ID format', 400, 'INVALID_PROJECT_ID');
  }

  // If absolute_path is being updated, check if it's whitelisted
  if (absolute_path !== undefined) {
    const isWhitelisted = await isPathWhitelisted(absolute_path);
    if (!isWhitelisted) {
      return res.status(403).json({
        error: {
          message: 'Project path is not whitelisted',
          code: 'PATH_NOT_WHITELISTED',
        },
      });
    }
  }

  // Build dynamic update query
  const updates: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (internal_alias !== undefined) {
    updates.push(`internal_alias = $${paramIndex}`);
    params.push(internal_alias);
    paramIndex++;
  }
  
  if (display_name !== undefined) {
    updates.push(`display_name = $${paramIndex}`);
    params.push(display_name);
    paramIndex++;
  }
  
  if (absolute_path !== undefined) {
    updates.push(`absolute_path = $${paramIndex}`);
    params.push(absolute_path);
    paramIndex++;
  }
  
  if (status !== undefined) {
    updates.push(`status = $${paramIndex}`);
    params.push(status);
    paramIndex++;
  }
  
  if (engine_config !== undefined) {
    updates.push(`engine_config = $${paramIndex}`);
    params.push(engine_config ? JSON.stringify(engine_config) : null);
    paramIndex++;
  }

  if (updates.length === 0) {
    throw new AppError('No fields to update', 400, 'NO_UPDATE_FIELDS');
  }

  // Add the ID parameter for WHERE clause
  params.push(id);
  
  const query = `
    UPDATE kolicode.projects
    SET ${updates.join(', ')}, updated_at = NOW()
    WHERE id = $${paramIndex}
    RETURNING 
      id,
      internal_alias,
      display_name,
      absolute_path,
      status,
      engine_config,
      created_at,
      updated_at
  `;

  const result = await queryPostgres<ProjectResponse>(query, params);
  
  const updatedProject = result.rows[0];
  
  if (!updatedProject) {
    throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
  }

  // Invalidate cache after update
  await invalidateProjectsCache();

  res.status(200).json(updatedProject);
}));

/**
 * DELETE /api/projects/:id
 * Delete a project
 */
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  logger.info({
    message: 'Deleting project',
    projectId: id,
  });

  // Validate UUID format
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(id)) {
    throw new AppError('Invalid project ID format', 400, 'INVALID_PROJECT_ID');
  }

  // Delete the project
  const result = await queryPostgres<{ count: string }>(
    'DELETE FROM kolicode.projects WHERE id = $1 RETURNING 1',
    [id]
  );

  if (parseInt(result.rows[0].count) === 0) {
    throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
  }

  // Invalidate cache after deletion
  await invalidateProjectsCache();

  res.status(200).json({
    message: 'Project deleted successfully',
    projectId: id
  });
}));

/**
 * POST /api/projects/:id/archive
 * Archive a project (set status to 'archived')
 */
router.post('/:id/archive', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  logger.info({
    message: 'Archiving project',
    projectId: id,
  });

  // Validate UUID format
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(id)) {
    throw new AppError('Invalid project ID format', 400, 'INVALID_PROJECT_ID');
  }

  // Update project status to archived
  const result = await queryPostgres<ProjectResponse>(
    `
      UPDATE kolicode.projects
      SET status = 'archived', updated_at = NOW()
      WHERE id = $1
      RETURNING 
        id,
        internal_alias,
        display_name,
        absolute_path,
        status,
        engine_config,
        created_at,
        updated_at
    `,
    [id]
  );
  
  const updatedProject = result.rows[0];
  
  if (!updatedProject) {
    throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
  }

  // Invalidate cache after status change
  await invalidateProjectsCache();

  res.status(200).json(updatedProject);
}));

/**
 * POST /api/projects/:id/activate
 * Activate a project (set status to 'active')
 */
router.post('/:id/activate', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  logger.info({
    message: 'Activating project',
    projectId: id,
  });

  // Validate UUID format
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(id)) {
    throw new AppError('Invalid project ID format', 400, 'INVALID_PROJECT_ID');
  }

  // Update project status to active
  const result = await queryPostgres<ProjectResponse>(
    `
      UPDATE kolicode.projects
      SET status = 'active', updated_at = NOW()
      WHERE id = $1
      RETURNING 
        id,
        internal_alias,
        display_name,
        absolute_path,
        status,
        engine_config,
        created_at,
        updated_at
    `,
    [id]
  );
  
  const updatedProject = result.rows[0];
  
  if (!updatedProject) {
    throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
  }

  // Invalidate cache after status change
  await invalidateProjectsCache();

  res.status(200).json(updatedProject);
}));

export default router;