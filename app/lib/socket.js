// app/lib/socket.js
import { Server } from 'socket.io';

let io;

export const initSocket = (server) => {
  if (io) return io;

  io = new Server(server, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

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
      // Broadcast to connection room
      socket.to(`connection:${data.connectionId}`).emit('new-message', data.message);
      
      // Also notify receiver's personal room
      socket.to(`user:${data.receiverId}`).emit('message-notification', {
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
      console.log('User disconnected:', socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};