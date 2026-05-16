import { Router, Request, Response } from 'express';
import type { QueryResultRow } from 'pg';
import { queryPostgres } from '../db/postgres';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();

interface ProjectRow extends QueryResultRow {
  id: string;
  owner_id: string | null;
  name: string;
  description: string | null;
  project_type: string;
  canvas_data: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: Date | string;
  updated_at: Date | string;
}

/**
 * GET /api/projects
 * List all projects
 */
router.get('/', (req: Request, res: Response) => {
  try {
    logger.debug({
      message: 'Listing projects',
      query: req.query,
    });

    // TODO: Implement actual project listing from database
    res.status(200).json({
      projects: [],
      total: 0,
      message: 'Projects endpoint - implementation pending',
    });
  } catch (error) {
    logger.error({
      message: 'Failed to list projects',
      error: error instanceof Error ? error.message : error,
    });
    res.status(500).json({
      error: {
        message: 'Failed to list projects',
        code: 'LIST_PROJECTS_ERROR',
      },
    });
  }
});

/**
 * POST /api/projects
 * Create a new project
 */
router.post('/', (req: Request, res: Response) => {
  try {
    const { name, description, type } = req.body;

    if (!name) {
      return res.status(400).json({
        error: {
          message: 'Project name is required',
          code: 'MISSING_NAME',
        },
      });
    }

    logger.info({
      message: 'Creating new project',
      name,
      type,
    });

    // TODO: Implement actual project creation
    res.status(201).json({
      message: 'Project creation endpoint - implementation pending',
      project: {
        id: 'temp-id',
        name,
        description,
        type: type || 'design',
      },
    });
  } catch (error) {
    logger.error({
      message: 'Failed to create project',
      error: error instanceof Error ? error.message : error,
    });
    res.status(500).json({
      error: {
        message: 'Failed to create project',
        code: 'CREATE_PROJECT_ERROR',
      },
    });
  }
});

/**
 * GET /api/projects/:id
 * Get a specific project
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    logger.debug({
      message: 'Fetching project',
      projectId: id,
    });

    const result = await queryPostgres<ProjectRow>(
      `
        SELECT
          id,
          owner_id,
          name,
          description,
          project_type,
          canvas_data,
          metadata,
          created_at,
          updated_at
        FROM kolicode.projects
        WHERE id = $1
        LIMIT 1
      `,
      [id]
    );

    const project = result.rows[0];

    if (!project) {
      throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
    }

    res.status(200).json({
      project: {
        id: project.id,
        ownerId: project.owner_id,
        name: project.name,
        description: project.description,
        type: project.project_type,
        canvasData: project.canvas_data,
        metadata: project.metadata,
        createdAt:
          project.created_at instanceof Date
            ? project.created_at.toISOString()
            : String(project.created_at),
        updatedAt:
          project.updated_at instanceof Date
            ? project.updated_at.toISOString()
            : String(project.updated_at),
      },
      fallbackMode: 'rest',
    });
}));

/**
 * PUT /api/projects/:id
 * Update a project
 */
router.put('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    logger.info({
      message: 'Updating project',
      projectId: id,
      updates: { name, description },
    });

    // TODO: Implement actual project update
    res.status(200).json({
      message: 'Project update endpoint - implementation pending',
      projectId: id,
    });
  } catch (error) {
    logger.error({
      message: 'Failed to update project',
      error: error instanceof Error ? error.message : error,
    });
    res.status(500).json({
      error: {
        message: 'Failed to update project',
        code: 'UPDATE_PROJECT_ERROR',
      },
    });
  }
});

/**
 * DELETE /api/projects/:id
 * Delete a project
 */
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    logger.info({
      message: 'Deleting project',
      projectId: id,
    });

    // TODO: Implement actual project deletion
    res.status(200).json({
      message: 'Project deleted successfully',
      projectId: id,
    });
  } catch (error) {
    logger.error({
      message: 'Failed to delete project',
      error: error instanceof Error ? error.message : error,
    });
    res.status(500).json({
      error: {
        message: 'Failed to delete project',
        code: 'DELETE_PROJECT_ERROR',
      },
    });
  }
});

export default router;
