export interface AuthenticatedSocketUser {
  userId: string;
  email?: string;
  role?: string;
  isAnonymous: boolean;
}

export interface WebSocketSessionState {
  user: AuthenticatedSocketUser;
  joinedProjects: Set<string>;
  lastHeartbeatAt: number;
}
