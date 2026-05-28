import { Server } from 'socket.io';

let ioInstance: Server | null = null;

export function setSocketServer(io: Server) {
  ioInstance = io;
}

export function emitProgress(assignmentId: string, event: string, data: Record<string, unknown>) {
  ioInstance?.to(`assignment:${assignmentId}`).emit(event, data);
}
