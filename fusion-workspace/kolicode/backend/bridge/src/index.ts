import 'express-async-errors';
import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import helmet from 'helmet';
import cors from 'cors';
import { closePostgresPool } from './db/postgres';
import { closeRedisClient } from './db/redis';
import { initializeDiagnosticsStore } from './diagnostics/store';
import { closeGrpcClients, createEngineGrpcClients } from './grpc/clients';
import {
  createBridgeGrpcServer,
  type BridgeGrpcServerHandle,
} from './grpc/server';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { rateLimiter } from './middleware/rateLimiter';
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import projectsRoutes from './routes/projects';
import assetsRoutes from './routes/assets';
import renderRoutes from './routes/render';
import diagnosticsRoutes from './routes/diagnostics';
import { setupWebSocket } from './websocket/server';
import { BridgeState } from './state/BridgeState';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');

// Initialize Express app
const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingInterval: parseInt(process.env.WS_PING_INTERVAL || '30000'),
  pingTimeout: parseInt(process.env.WS_PING_TIMEOUT || '5000'),
});

// Initialize Bridge State Machine
const bridgeState = new BridgeState();
void initializeDiagnosticsStore();
const grpcClients = createEngineGrpcClients();
let grpcServerHandle: BridgeGrpcServerHandle | null = null;

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing and encoding
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request logging
app.use(requestLogger);

// Rate limiting (applied to API routes, not health check)
app.use('/api/', rateLimiter);

// Health check (no rate limiting)
app.use('/health', healthRoutes);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/assets', assetsRoutes);
app.use('/api/render', renderRoutes);
app.use('/api/diagnostics', diagnosticsRoutes);

// Bridge State Endpoint
app.get('/api/bridge/state', (req, res) => {
  res.json({
    status: 'ok',
    state: bridgeState.getCurrentState(),
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
  });
});

// Setup WebSocket server
setupWebSocket(io, bridgeState);

// Error handling (must be last)
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    message: 'The requested resource does not exist',
  });
});

// Graceful shutdown
let isShuttingDown = false;

const gracefulShutdown = async (signal: string) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info(`Received ${signal}, starting graceful shutdown...`);

  await Promise.allSettled([
    closePostgresPool(),
    closeRedisClient(),
    closeGrpcClients(grpcClients),
    grpcServerHandle?.tryShutdown() ?? Promise.resolve(),
  ]);

  // Stop accepting new connections
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start server
const startServers = async () => {
  if (process.env.GRPC_BRIDGE_ENABLED !== 'false') {
    grpcServerHandle = await createBridgeGrpcServer(bridgeState);
  }

  httpServer.listen(PORT, () => {
    logger.info(
      `🚀 Bridge API Gateway started on port ${PORT} (${NODE_ENV} mode)`
    );
    logger.info(`📡 WebSocket server active on /socket.io`);
    logger.info(`🔗 Allowed CORS origins: ${ALLOWED_ORIGINS.join(', ')}`);

    if (grpcServerHandle) {
      logger.info(`🛰️ Bridge gRPC server active on port ${grpcServerHandle.port}`);
    }
  });
};

void startServers().catch((error) => {
  logger.error({
    message: 'Failed to start Bridge services',
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});

export { app, httpServer, io, bridgeState, grpcClients };
