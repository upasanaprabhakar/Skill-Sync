// server.js
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { startReminderScheduler, stopReminderScheduler } = require('./app/lib/sessionScheduler');
const { startSessionCron, stopSessionCron } = require('./app/lib/sessionCron');

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



  
  // Initialize Socket.IO
  const io = new Server(server, {
    cors: {
      origin: 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // ✅ Make io globally accessible for API routes
  global.io = io;

  // 🟢 Online users tracking: userId -> Set of socketIds (for multiple tabs/devices)
  const onlineUsers = new Map();

  // Helper function to add user online
  const addUserOnline = (userId, socketId) => {
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socketId);
    
    // Only broadcast if this is the first connection for this user
    if (onlineUsers.get(userId).size === 1) {
      io.emit('user-online', { userId });
      console.log(`✅ User ${userId} is now ONLINE`);
    }
  };

  // Helper function to remove user online
  const removeUserOnline = (userId, socketId) => {
    if (onlineUsers.has(userId)) {
      onlineUsers.get(userId).delete(socketId);
      
      // If no more connections for this user, mark as offline
      if (onlineUsers.get(userId).size === 0) {
        onlineUsers.delete(userId);
        io.emit('user-offline', { userId });
        console.log(`❌ User ${userId} is now OFFLINE`);
      }
    }
  };

  // Helper function to check if user is online
  const isUserOnline = (userId) => {
    return onlineUsers.has(userId) && onlineUsers.get(userId).size > 0;
  };

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    console.log('✅ Client connected:', socket.id);

    // Join user to their personal room and mark as online
    socket.on('join', (userId) => {
      const roomName = `user:${userId}`;
      socket.join(roomName);
      socket.userId = userId; // Store userId on socket
      
      // Mark user as online
      addUserOnline(userId, socket.id);
      
      console.log(`👤 User ${userId} joined room: ${roomName}`);
    });

    // Check if a specific user is online
    socket.on('check-user-status', ({ userId }) => {
      const isOnline = isUserOnline(userId);
      socket.emit('user-status', { userId, isOnline });
      console.log(`📊 Status check for user ${userId}: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
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
      
      socket.to(`connection:${data.connectionId}`).emit('new-message', data.message);
      
      io.to(`user:${data.receiverId}`).emit('message-notification', {
        connectionId: data.connectionId,
        from: data.senderId,
        senderName: data.senderName,
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

    // ===== SESSION EVENTS =====
    
    // Session booked
    socket.on('session-booked', (data) => {
      const { sessionId, mentorId, studentId, session } = data;
      
      io.to(`user:${mentorId}`).emit('new-session-request', {
        sessionId,
        session,
        message: 'You have a new session request',
        timestamp: new Date()
      });
      
      console.log(`📅 Session booked notification sent to mentor ${mentorId}`);
    });

    // Session confirmed
    socket.on('session-confirmed', (data) => {
      const { sessionId, studentId, session } = data;
      
      io.to(`user:${studentId}`).emit('session-confirmed', {
        sessionId,
        session,
        message: 'Your session has been confirmed',
        timestamp: new Date()
      });
      
      console.log(`✅ Session confirmed notification sent to student ${studentId}`);
    });

    // Session cancelled
    socket.on('session-cancelled', (data) => {
      const { sessionId, userId, otherUserId } = data;
      
      io.to(`user:${otherUserId}`).emit('session-cancelled', {
        sessionId,
        message: 'A session has been cancelled',
        timestamp: new Date()
      });
      
      console.log(`❌ Session cancelled notification sent`);
    });

    // Session updated/rescheduled
    socket.on('session-updated', (data) => {
      const { sessionId, mentorId, studentId, session } = data;
      
      io.to(`user:${mentorId}`).emit('session-updated', {
        sessionId,
        session,
        message: 'A session has been updated',
        timestamp: new Date()
      });
      
      io.to(`user:${studentId}`).emit('session-updated', {
        sessionId,
        session,
        message: 'A session has been updated',
        timestamp: new Date()
      });
      
      console.log(`🔄 Session updated notification sent`);
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log('❌ Client disconnected:', socket.id, 'Reason:', reason);
      
      // Remove user from online list
      if (socket.userId) {
        removeUserOnline(socket.userId, socket.id);
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('🔴 Socket error:', error);
    });
  });

  // Start session reminder scheduler with io instance
  startReminderScheduler(io);
  
  // Start session cron job to auto-update expired sessions
  startSessionCron();

  // Handle graceful shutdown
  const shutdown = () => {
    console.log('\n🛑 Shutting down gracefully...');
    stopReminderScheduler();
    stopSessionCron();
    
    // Clear online users
    onlineUsers.clear();
    
    io.close(() => {
      console.log('✅ Socket.IO closed');
      server.close(() => {
        console.log('✅ HTTP server closed');
        process.exit(0);
      });
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  server
    .once('error', (err) => {
      console.error('❌ Server error:', err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`✅ Ready on http://${hostname}:${port}`);
      console.log(`✅ Socket.IO server running on ws://${hostname}:${port}`);
      console.log(`🟢 Online presence tracking enabled`);
    });
});