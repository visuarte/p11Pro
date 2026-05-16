import { Server as SocketIOServer, type Socket } from 'socket.io';
import { logger } from '../utils/logger';
import { BridgeState } from '../state/BridgeState';
import { authenticateSocket } from './auth';
import { safeAck } from './ack';
import { setupProjectHandlers } from './handlers/projectHandlers';
import { setupCanvasHandlers } from './handlers/canvasHandlers';
import { emitProjectPresence } from './rooms';

interface HeartbeatPayload {
  clientTimestamp?: number;
}

function markSocketHeartbeat(socket: Socket): void {
  if (socket.data.session) {
    socket.data.session.lastHeartbeatAt = Date.now();
  }
}

/**
 * Setup WebSocket server with all event handlers
 */
export const setupWebSocket = (io: SocketIOServer, bridgeState: BridgeState) => {
  logger.info('Setting up WebSocket server');

  // Middleware: authenticate connection
  io.use(authenticateSocket);

  const heartbeatIntervalMs = parseInt(
    process.env.WS_HEARTBEAT_INTERVAL_MS || '15000',
    10
  );
  const heartbeatTimeoutMs = parseInt(
    process.env.WS_HEARTBEAT_TIMEOUT_MS || '45000',
    10
  );

  const heartbeatTimer = setInterval(() => {
    const now = Date.now();

    for (const socket of io.sockets.sockets.values()) {
      const session = socket.data.session;

      if (!session) {
        continue;
      }

      if (now - session.lastHeartbeatAt > heartbeatTimeoutMs) {
        logger.warn({
          message: 'Disconnecting stale WebSocket client after heartbeat timeout',
          socketId: socket.id,
          userId: session.user.userId,
          timeoutMs: heartbeatTimeoutMs,
        });
        socket.disconnect(true);
        continue;
      }

      socket.emit('server:heartbeat', {
        timestamp: new Date().toISOString(),
        state: bridgeState.getState(),
      });
    }
  }, heartbeatIntervalMs);

  io.engine.on('close', () => {
    clearInterval(heartbeatTimer);
  });

  // Connection handler
  io.on('connection', (socket) => {
    markSocketHeartbeat(socket);

    logger.info({
      message: 'Client connected to WebSocket',
      socketId: socket.id,
      userId: socket.data.session?.user.userId,
      isAnonymous: socket.data.session?.user.isAnonymous,
      totalClients: io.engine.clientsCount,
    });

    // Send welcome message
    socket.emit('server:welcome', {
      message: 'Connected to KoliCode Bridge',
      socketId: socket.id,
      user: socket.data.session?.user,
      timestamp: new Date().toISOString(),
    });

    socket.on('bridge:ping', (payload: HeartbeatPayload = {}, callback) => {
      markSocketHeartbeat(socket);

      const response = {
        clientTimestamp: payload.clientTimestamp ?? null,
        serverTimestamp: Date.now(),
        state: bridgeState.getState(),
      };

      socket.emit('bridge:pong', response);
      safeAck(callback, response);
    });

    socket.on(
      'client:heartbeat',
      (_payload: Record<string, never> = {}, callback?: (response: {
        acknowledged: boolean;
        serverTimestamp: number;
      }) => void) => {
      markSocketHeartbeat(socket);
      safeAck(callback, {
        acknowledged: true,
        serverTimestamp: Date.now(),
      });
      }
    );

    // Setup event handlers
    setupProjectHandlers(socket, io, bridgeState);
    setupCanvasHandlers(socket, io, bridgeState);

    // Generic error handler
    socket.on('error', (error) => {
      logger.error({
        message: 'WebSocket error',
        socketId: socket.id,
        error: error instanceof Error ? error.message : error,
      });
    });

    socket.on('disconnecting', () => {
      const session = socket.data.session;

      if (!session) {
        return;
      }

      for (const projectId of session.joinedProjects) {
        socket.to(`project:${projectId}`).emit('project:user-left', {
          socketId: socket.id,
          projectId,
          userId: session.user.userId,
          timestamp: new Date().toISOString(),
        });
        emitProjectPresence(io, projectId);
      }
    });

    // Disconnection handler
    socket.on('disconnect', (reason) => {
      logger.info({
        message: 'Client disconnected from WebSocket',
        socketId: socket.id,
        userId: socket.data.session?.user.userId,
        reason,
        totalClients: io.engine.clientsCount,
      });
    });
  });

  // Server-level error handler
  io.on('error', (error) => {
    logger.error({
      message: 'WebSocket server error',
      error: error instanceof Error ? error.message : error,
    });
  });

  return io;
};

export default setupWebSocket;
