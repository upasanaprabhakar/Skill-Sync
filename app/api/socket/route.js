//app/api/socket/route.js
import { Server } from 'socket.io';

let io;

export function GET(req) {
  if (!io) {
    const httpServer = req.socket.server;
    
    if (!httpServer.io) {
      io = new Server(httpServer, {
        path: '/api/socket',
        addTrailingSlash: false,
        cors: {
          origin: '*',
          methods: ['GET', 'POST']
        }
      });

      httpServer.io = io;

      io.on('connection', (socket) => {
        console.log('✅ Client connected:', socket.id);

        // Join user to their personal room
        socket.on('join', (userId) => {
          socket.join(`user:${userId}`);
          console.log(`User ${userId} joined their room`);
        });

        // Join connection room for chat
        socket.on('join-connection', (connectionId) => {
          socket.join(`connection:${connectionId}`);
          console.log(`Socket ${socket.id} joined connection:${connectionId}`);
        });

        // Handle new message
        socket.on('send-message', (data) => {
          console.log('📨 Message received:', data);
          
          // Broadcast to connection room (except sender)
          socket.to(`connection:${data.connectionId}`).emit('new-message', data.message);
          
          // Notify receiver's personal room
          io.to(`user:${data.receiverId}`).emit('message-notification', {
            connectionId: data.connectionId,
            from: data.senderId
          });
        });

        // Handle typing indicator
        socket.on('typing', (data) => {
          socket.to(`connection:${data.connectionId}`).emit('user-typing', {
            userId: data.userId,
            isTyping: data.isTyping
          });
        });

        // Handle disconnect
        socket.on('disconnect', () => {
          console.log('❌ Client disconnected:', socket.id);
        });
      });

      console.log('🚀 Socket.IO server initialized');
    } else {
      io = httpServer.io;
    }
  }

  return new Response('Socket server running', { status: 200 });
}