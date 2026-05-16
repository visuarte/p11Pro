import { Socket, Server as SocketIOServer } from 'socket.io';
import { logger } from '../../utils/logger';
import { BridgeState } from '../../state/BridgeState';
import { safeAck } from '../ack';
import {
  emitProjectPresence,
  joinProjectRoom,
  leaveProjectRoom,
} from '../rooms';

/**
 * Project-related WebSocket event handlers
 * Manages project room subscriptions and updates
 */
export const setupProjectHandlers = (
  socket: Socket,
  io: SocketIOServer,
  bridgeState: BridgeState
) => {
  /**
   * Join a project room
   * Allows real-time updates for a specific project
   */
  socket.on('project:join', (data: { projectId: string }, callback) => {
    try {
      const { projectId } = data;

      if (!projectId) {
        logger.warn({
          message: 'Project join: missing projectId',
          socketId: socket.id,
        });
        return safeAck(callback, { error: 'projectId is required' });
      }

      const roomName = joinProjectRoom(socket, projectId);

      logger.info({
        message: 'Client joined project room',
        socketId: socket.id,
        projectId,
        room: roomName,
      });

      // Notify others in the room
      socket.to(roomName).emit('project:user-joined', {
        socketId: socket.id,
        projectId,
        userId: socket.data.session?.user.userId,
        timestamp: new Date().toISOString(),
      });

      emitProjectPresence(io, projectId);

      // Send confirmation to requester
      safeAck(callback, {
        success: true,
        projectId,
        room: roomName,
      });
    } catch (error) {
      logger.error({
        message: 'Error joining project room',
        socketId: socket.id,
        error: error instanceof Error ? error.message : error,
      });
      safeAck(callback, {
        error: 'Failed to join project room',
      });
    }
  });

  /**
   * Leave a project room
   */
  socket.on('project:leave', (data: { projectId: string }, callback) => {
    try {
      const { projectId } = data;
      const roomName = leaveProjectRoom(socket, projectId);

      logger.info({
        message: 'Client left project room',
        socketId: socket.id,
        projectId,
      });

      // Notify others in the room
      socket.to(roomName).emit('project:user-left', {
        socketId: socket.id,
        projectId,
        userId: socket.data.session?.user.userId,
        timestamp: new Date().toISOString(),
      });

      emitProjectPresence(io, projectId);

      safeAck(callback, { success: true, projectId });
    } catch (error) {
      logger.error({
        message: 'Error leaving project room',
        socketId: socket.id,
        error: error instanceof Error ? error.message : error,
      });
      safeAck(callback, {
        error: 'Failed to leave project room',
      });
    }
  });

  /**
   * Update project metadata
   * Only updates to subscribing clients in the room
   */
  socket.on(
    'project:update',
    (data: { projectId: string; updates: Record<string, unknown> }, callback) => {
      try {
        const { projectId, updates } = data;

        if (!projectId || !updates) {
          return safeAck(callback, {
            error: 'projectId and updates are required',
          });
        }

        const roomName = joinProjectRoom(socket, projectId);

        logger.debug({
          message: 'Project update received',
          socketId: socket.id,
          projectId,
          updates,
        });

        // Broadcast to room
        io.to(roomName).emit('project:updated', {
          projectId,
          updates,
          updatedBy: socket.id,
          userId: socket.data.session?.user.userId,
          timestamp: new Date().toISOString(),
        });

        safeAck(callback, { success: true });
      } catch (error) {
        logger.error({
          message: 'Error updating project',
          socketId: socket.id,
          error: error instanceof Error ? error.message : error,
        });
        safeAck(callback, {
          error: 'Failed to update project',
        });
      }
    }
  );

  /**
   * Request project status
   */
  socket.on('project:status', (data: { projectId: string }, callback) => {
    try {
      const { projectId } = data;

      logger.debug({
        message: 'Project status requested',
        socketId: socket.id,
        projectId,
      });

      // TODO: Fetch actual project status from database
      safeAck(callback, {
        success: true,
        projectId,
        status: 'ACTIVE',
        lastModified: new Date().toISOString(),
      });
    } catch (error) {
      logger.error({
        message: 'Error fetching project status',
        socketId: socket.id,
        error: error instanceof Error ? error.message : error,
      });
      safeAck(callback, {
        error: 'Failed to fetch project status',
      });
    }
  });
};

export default setupProjectHandlers;
