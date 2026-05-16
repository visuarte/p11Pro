import { Socket, Server as SocketIOServer } from 'socket.io';
import { logger } from '../../utils/logger';
import { BridgeState } from '../../state/BridgeState';
import { safeAck } from '../ack';
import { buildProjectRoom, isSocketInProjectRoom } from '../rooms';

/**
 * Canvas-related WebSocket event handlers
 * Manages real-time canvas synchronization
 */
export const setupCanvasHandlers = (
  socket: Socket,
  io: SocketIOServer,
  bridgeState: BridgeState
) => {
  /**
   * Canvas update event
   * Broadcasts canvas changes to all clients in the project
   */
  socket.on(
    'canvas:update',
    (
      data: {
        projectId: string;
        changes: Record<string, unknown>;
        version: number;
      },
      callback
    ) => {
      try {
        const { projectId, changes, version } = data;

        if (!projectId || !changes) {
          return safeAck(callback, {
            error: 'projectId and changes are required',
          });
        }

        if (!isSocketInProjectRoom(socket, projectId)) {
          return safeAck(callback, {
            error: 'Join the project room before sending canvas updates',
          });
        }

        const roomName = buildProjectRoom(projectId);

        logger.debug({
          message: 'Canvas update received',
          socketId: socket.id,
          projectId,
          version,
        });

        // Broadcast to other clients in the project
        socket.to(roomName).emit('canvas:updated', {
          projectId,
          changes,
          version,
          updatedBy: socket.id,
          userId: socket.data.session?.user.userId,
          timestamp: new Date().toISOString(),
        });

        // Send acknowledgment to sender
        safeAck(callback, {
          success: true,
          version,
          appliedAt: new Date().toISOString(),
        });
      } catch (error) {
        logger.error({
          message: 'Error processing canvas update',
          socketId: socket.id,
          error: error instanceof Error ? error.message : error,
        });
        safeAck(callback, {
          error: 'Failed to process canvas update',
        });
      }
    }
  );

  /**
   * Cursor position update
   * Share user cursor positions for collaborative awareness
   */
  socket.on(
    'cursor:move',
    (data: { projectId: string; position: { x: number; y: number } }, callback) => {
      try {
        const { projectId, position } = data;

        if (!projectId || !position) {
          return safeAck(callback, {
            error: 'projectId and position are required',
          });
        }

        if (!isSocketInProjectRoom(socket, projectId)) {
          return safeAck(callback, {
            error: 'Join the project room before sharing cursor movement',
          });
        }

        const roomName = buildProjectRoom(projectId);

        // Broadcast cursor position to others
        socket.to(roomName).emit('cursor:moved', {
          socketId: socket.id,
          projectId,
          position,
          userId: socket.data.session?.user.userId,
          timestamp: new Date().toISOString(),
        });

        safeAck(callback, { success: true });
      } catch (error) {
        logger.error({
          message: 'Error processing cursor move',
          socketId: socket.id,
          error: error instanceof Error ? error.message : error,
        });
        safeAck(callback, {
          error: 'Failed to process cursor move',
        });
      }
    }
  );

  /**
   * Request canvas sync
   * Full canvas state synchronization
   */
  socket.on(
    'canvas:sync',
    (data: { projectId: string }, callback) => {
      try {
        const { projectId } = data;

        if (!projectId) {
          return safeAck(callback, {
            error: 'projectId is required',
          });
        }

        logger.debug({
          message: 'Canvas sync requested',
          socketId: socket.id,
          projectId,
        });

        if (!isSocketInProjectRoom(socket, projectId)) {
          return safeAck(callback, {
            error: 'Join the project room before requesting canvas sync',
          });
        }

        // TODO: Fetch actual canvas state from database
        safeAck(callback, {
          success: true,
          projectId,
          state: {
            version: 0,
            layers: [],
            objects: [],
          },
          lastModified: new Date().toISOString(),
        });
      } catch (error) {
        logger.error({
          message: 'Error syncing canvas',
          socketId: socket.id,
          error: error instanceof Error ? error.message : error,
        });
        safeAck(callback, {
          error: 'Failed to sync canvas',
        });
      }
    }
  );

  /**
   * Undo/Redo event
   */
  socket.on(
    'canvas:undo',
    (data: { projectId: string }, callback) => {
      try {
        const { projectId } = data;

        if (!projectId) {
          return safeAck(callback, { error: 'projectId is required' });
        }

        if (!isSocketInProjectRoom(socket, projectId)) {
          return safeAck(callback, {
            error: 'Join the project room before sending undo actions',
          });
        }

        const roomName = buildProjectRoom(projectId);

        logger.debug({
          message: 'Undo action',
          socketId: socket.id,
          projectId,
        });

        // Broadcast undo to other clients
        socket.to(roomName).emit('canvas:action', {
          projectId,
          action: 'undo',
          initiatedBy: socket.id,
          userId: socket.data.session?.user.userId,
          timestamp: new Date().toISOString(),
        });

        safeAck(callback, { success: true });
      } catch (error) {
        logger.error({
          message: 'Error processing undo',
          socketId: socket.id,
          error: error instanceof Error ? error.message : error,
        });
        safeAck(callback, {
          error: 'Failed to process undo',
        });
      }
    }
  );

  /**
   * Redo event
   */
  socket.on(
    'canvas:redo',
    (data: { projectId: string }, callback) => {
      try {
        const { projectId } = data;

        if (!projectId) {
          return safeAck(callback, { error: 'projectId is required' });
        }

        if (!isSocketInProjectRoom(socket, projectId)) {
          return safeAck(callback, {
            error: 'Join the project room before sending redo actions',
          });
        }

        const roomName = buildProjectRoom(projectId);

        logger.debug({
          message: 'Redo action',
          socketId: socket.id,
          projectId,
        });

        // Broadcast redo to other clients
        socket.to(roomName).emit('canvas:action', {
          projectId,
          action: 'redo',
          initiatedBy: socket.id,
          userId: socket.data.session?.user.userId,
          timestamp: new Date().toISOString(),
        });

        safeAck(callback, { success: true });
      } catch (error) {
        logger.error({
          message: 'Error processing redo',
          socketId: socket.id,
          error: error instanceof Error ? error.message : error,
        });
        safeAck(callback, {
          error: 'Failed to process redo',
        });
      }
    }
  );
};

export default setupCanvasHandlers;
