import type { ExtendedError, Socket } from 'socket.io';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { logger } from '../utils/logger';
import type { AuthenticatedSocketUser, WebSocketSessionState } from './types';

type SocketAuthCallback = (error?: ExtendedError) => void;

interface BridgeJwtPayload extends JwtPayload {
  sub?: string;
  email?: string;
  role?: string;
}

function getSocketToken(socket: Socket): string | null {
  const authToken = socket.handshake.auth.token;

  if (typeof authToken === 'string' && authToken.trim().length > 0) {
    return authToken.trim();
  }

  const headerToken = socket.handshake.headers.authorization;

  if (typeof headerToken === 'string' && headerToken.startsWith('Bearer ')) {
    return headerToken.slice('Bearer '.length).trim();
  }

  return null;
}

function buildAnonymousUser(socket: Socket): AuthenticatedSocketUser {
  return {
    userId: `guest:${socket.id}`,
    role: 'guest',
    isAnonymous: true,
  };
}

function attachSocketSession(
  socket: Socket,
  user: AuthenticatedSocketUser
): void {
  socket.data.session = {
    user,
    joinedProjects: new Set<string>(),
    lastHeartbeatAt: Date.now(),
  } satisfies WebSocketSessionState;
}

function allowAnonymousSocket(socket: Socket): boolean {
  return (
    process.env.NODE_ENV !== 'production' &&
    process.env.WS_ALLOW_ANONYMOUS !== 'false'
  );
}

function rejectSocket(next: SocketAuthCallback, message: string): void {
  next(new Error(message));
}

export function authenticateSocket(
  socket: Socket,
  next: SocketAuthCallback
): void {
  const token = getSocketToken(socket);

  if (!token) {
    if (allowAnonymousSocket(socket)) {
      const user = buildAnonymousUser(socket);
      attachSocketSession(socket, user);

      logger.warn({
        message: 'Allowing anonymous WebSocket connection in development',
        socketId: socket.id,
        userId: user.userId,
      });

      next();
      return;
    }

    rejectSocket(next, 'Authentication required');
    return;
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    rejectSocket(next, 'JWT_SECRET is not configured');
    return;
  }

  try {
    const payload = jwt.verify(token, jwtSecret) as BridgeJwtPayload;
    const userId = typeof payload.sub === 'string' ? payload.sub : null;

    if (!userId) {
      rejectSocket(next, 'Token subject is required');
      return;
    }

    attachSocketSession(socket, {
      userId,
      email: typeof payload.email === 'string' ? payload.email : undefined,
      role: typeof payload.role === 'string' ? payload.role : 'user',
      isAnonymous: false,
    });

    next();
  } catch (error) {
    logger.warn({
      message: 'Rejected WebSocket connection with invalid token',
      socketId: socket.id,
      error: error instanceof Error ? error.message : String(error),
    });
    rejectSocket(next, 'Invalid authentication token');
  }
}
