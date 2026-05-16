import type { Server as SocketIOServer, Socket } from 'socket.io';

export function buildProjectRoom(projectId: string): string {
  return `project:${projectId}`;
}

function getSocketSession(socket: Socket) {
  return socket.data.session as
    | {
        joinedProjects: Set<string>;
      }
    | undefined;
}

export function joinProjectRoom(socket: Socket, projectId: string): string {
  const roomName = buildProjectRoom(projectId);
  socket.join(roomName);
  getSocketSession(socket)?.joinedProjects.add(projectId);
  return roomName;
}

export function leaveProjectRoom(socket: Socket, projectId: string): string {
  const roomName = buildProjectRoom(projectId);
  socket.leave(roomName);
  getSocketSession(socket)?.joinedProjects.delete(projectId);
  return roomName;
}

export function isSocketInProjectRoom(
  socket: Socket,
  projectId: string
): boolean {
  return getSocketSession(socket)?.joinedProjects.has(projectId) ?? false;
}

export function emitProjectPresence(
  io: SocketIOServer,
  projectId: string
): void {
  const roomName = buildProjectRoom(projectId);
  const activeConnections = io.sockets.adapter.rooms.get(roomName)?.size ?? 0;

  io.to(roomName).emit('project:presence', {
    projectId,
    activeConnections,
    timestamp: new Date().toISOString(),
  });
}
