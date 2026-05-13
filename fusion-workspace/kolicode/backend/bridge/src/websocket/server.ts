import { Server as SocketIOServer } from 'socket.io';
import { logger } from '../utils/logger';
import { BridgeState } from '../state/BridgeState';
import { setupProjectHandlers } from './handlers/projectHandlers';
import { setupCanvasHandlers } from './handlers/canvasHandlers';

/**
 * Setup WebSocket server with all event handlers
 */
export const setupWebSocket = (io: SocketIOServer, bridgeState: BridgeState) => {
  logger.info('Setting up WebSocket server');

  // Middleware: authenticate connection
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    // TODO: Implement actual JWT validation
    if (!token) {
      logger.warn({
        message: 'WebSocket connection attempted without token',
        socketId: socket.id,
      });
      // For now, allow all connections in development
      if (process.env.NODE_ENV === 'production') {
        return next(new Error('Authentication required'));
      }
    }
    next();
  });

  // Connection handler
  io.on('connection', (socket) => {
    logger.info({
      message: 'Client connected to WebSocket',
      socketId: socket.id,
      totalClients: io.engine.clientsCount,
    });

    // Send welcome message
    socket.emit('server:welcome', {
      message: 'Connected to KoliCode Bridge',
      socketId: socket.id,
      timestamp: new Date().toISOString(),
    });

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

    // Disconnection handler
    socket.on('disconnect', (reason) => {
      logger.info({
        message: 'Client disconnected from WebSocket',
        socketId: socket.id,
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

