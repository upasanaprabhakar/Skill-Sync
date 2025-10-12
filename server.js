// server.js
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize Socket.IO with proper configuration
  const io = new Server(server, {
    cors: {
      origin: 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling'], // Allow both for fallback
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    console.log('✅ Client connected:', socket.id);

    // Join user to their personal room
    socket.on('join', (userId) => {
      const roomName = `user:${userId}`;
      socket.join(roomName);
      console.log(`👤 User ${userId} joined room: ${roomName}`);
    });

    // Join connection room for chat
    socket.on('join-connection', (connectionId) => {
      const roomName = `connection:${connectionId}`;
      socket.join(roomName);
      console.log(`🔗 Socket ${socket.id} joined ${roomName}`);
    });

    // Leave connection room
    socket.on('leave-connection', (connectionId) => {
      const roomName = `connection:${connectionId}`;
      socket.leave(roomName);
      console.log(`🚪 Socket ${socket.id} left ${roomName}`);
    });

    // Handle new message
    socket.on('send-message', (data) => {
      console.log('📨 Message received:', data);
      
      // Broadcast to connection room (except sender)
      socket.to(`connection:${data.connectionId}`).emit('new-message', data.message);
      
      // Notify receiver's personal room for notifications
      io.to(`user:${data.receiverId}`).emit('message-notification', {
        connectionId: data.connectionId,
        from: data.senderId,
        message: data.message
      });
    });

    // Handle typing indicator
    socket.on('typing', (data) => {
      console.log('⌨️ User typing:', data);
      socket.to(`connection:${data.connectionId}`).emit('user-typing', {
        userId: data.userId,
        isTyping: true
      });
    });

    // Handle stop typing
    socket.on('stop-typing', (data) => {
      console.log('⏹️ User stopped typing:', data);
      socket.to(`connection:${data.connectionId}`).emit('user-typing', {
        userId: data.userId,
        isTyping: false
      });
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log('❌ Client disconnected:', socket.id, 'Reason:', reason);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('🔴 Socket error:', error);
    });
  });

  server
    .once('error', (err) => {
      console.error('❌ Server error:', err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`✅ Ready on http://${hostname}:${port}`);
      console.log(`✅ Socket.IO server running on ws://${hostname}:${port}`);
    });
});