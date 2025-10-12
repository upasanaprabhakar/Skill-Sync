// app/context/SocketContext.js
'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext({
  socket: null,
  isConnected: false
});

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    // Prevent multiple connections
    if (socketRef.current) {
      return;
    }

    console.log('🔌 Initializing Socket.IO connection...');

    // Connect to the root path where server.js handles Socket.IO
    const socketInstance = io('http://localhost:3000', {
      transports: ['websocket', 'polling'], // Try websocket first, fallback to polling
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      timeout: 10000,
      autoConnect: true
    });

    socketRef.current = socketInstance;

    socketInstance.on('connect', () => {
      console.log('✅ Socket connected successfully! ID:', socketInstance.id);
      setIsConnected(true);
      
      // Join user room if userId exists
      const userId = localStorage.getItem('userId');
      if (userId) {
        const userIdNum = parseInt(userId);
        socketInstance.emit('join', userIdNum);
        console.log('👤 Joined user room:', userIdNum);
      }
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected. Reason:', reason);
      setIsConnected(false);
      
      // Auto-reconnect on certain disconnect reasons
      if (reason === 'io server disconnect') {
        // Server disconnected, manually reconnect
        socketInstance.connect();
      }
    });

    socketInstance.on('connect_error', (error) => {
      console.error('🔴 Socket connection error:', error.message);
      setIsConnected(false);
    });

    socketInstance.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
      
      // Rejoin user room after reconnection
      const userId = localStorage.getItem('userId');
      if (userId) {
        socketInstance.emit('join', parseInt(userId));
      }
    });

    socketInstance.on('reconnect_attempt', (attemptNumber) => {
      console.log('🔄 Reconnection attempt:', attemptNumber);
    });

    socketInstance.on('reconnect_error', (error) => {
      console.error('🔴 Reconnection error:', error.message);
    });

    socketInstance.on('reconnect_failed', () => {
      console.error('🔴 Reconnection failed after all attempts');
    });

    setSocket(socketInstance);

    return () => {
      if (socketRef.current) {
        console.log('🧹 Cleaning up socket connection');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}