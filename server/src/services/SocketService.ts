import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';

class SocketService {
  private io: SocketServer | null = null;

  init(server: HttpServer) {
    this.io = new SocketServer(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    this.io.on('connection', (socket) => {
      console.log('[Socket] Static Client connected:', socket.id);
      
      socket.on('disconnect', () => {
        console.log('[Socket] Client disconnected');
      });
    });
  }

  emit(event: string, data: any) {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  emitToRoom(room: string, event: string, data: any) {
    if (this.io) {
      this.io.to(room).emit(event, data);
    }
  }
}

export default new SocketService();
