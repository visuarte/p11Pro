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
import { rateLimiter } = from './middleware/rateLimiter';
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import projectsRoutes from './routes/projects';
import projectResolverRoutes from './routes/projectResolver';
import assetsRoutes from './routes/assets';
import renderRoutes from './routes/render';
import diagnosticsRoutes from './routes/diagnostics';
import { setupWebSocket } from './websocket/server';
import { BridgeState } from './state/BridgeState';