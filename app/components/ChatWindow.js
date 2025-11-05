'use client';

import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';
import styles from './ChatWindow.module.css';
import { SendIcon, XIcon } from '../components/icons';

export default function ChatWindow({ connection, currentUserId, onClose }) {
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const otherUser = connection.mentorId === currentUserId 
    ? connection.student 
    : connection.mentor;

  useEffect(() => {
    loadMessages();
  }, [connection.id]);

  useEffect(() => {
    if (socket && isConnected) {
      console.log('🔗 Joining connection room:', connection.id);
      
      socket.emit('join-connection', connection.id);
      
      // Request online status for the other user
      socket.emit('check-user-status', { userId: otherUser.id });

      const handleNewMessage = (message) => {
        console.log('📨 Received new message:', message);
        setMessages(prev => {
          if (prev.some(m => m.id === message.id)) {
            return prev;
          }
          return [...prev, message];
        });
      };

      const handleUserTyping = ({ userId, isTyping: typing }) => {
        if (userId !== currentUserId) {
          setIsTyping(typing);
        }
      };

      const handleUserOnline = ({ userId }) => {
        if (userId === otherUser.id) {
          console.log('✅ User is online:', userId);
          setIsOtherUserOnline(true);
        }
      };

      const handleUserOffline = ({ userId }) => {
        if (userId === otherUser.id) {
          console.log('❌ User is offline:', userId);
          setIsOtherUserOnline(false);
        }
      };

      const handleUserStatus = ({ userId, isOnline }) => {
        if (userId === otherUser.id) {
          console.log('📊 User status:', userId, isOnline);
          setIsOtherUserOnline(isOnline);
        }
      };

      socket.on('new-message', handleNewMessage);
      socket.on('user-typing', handleUserTyping);
      socket.on('user-online', handleUserOnline);
      socket.on('user-offline', handleUserOffline);
      socket.on('user-status', handleUserStatus);

      return () => {
        console.log('🚪 Leaving connection room:', connection.id);
        socket.emit('leave-connection', connection.id);
        socket.off('new-message', handleNewMessage);
        socket.off('user-typing', handleUserTyping);
        socket.off('user-online', handleUserOnline);
        socket.off('user-offline', handleUserOffline);
        socket.off('user-status', handleUserStatus);
        
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      };
    }
  }, [socket, isConnected, connection.id, currentUserId, otherUser.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/messages?connectionId=${connection.id}&userId=${currentUserId}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to load messages');
      }

      const data = await response.json();
      setMessages(data.messages || []);
      
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('❌ Error loading messages:', error);
      toast.error('Failed to load messages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (socket && isConnected) {
      socket.emit('typing', {
        connectionId: connection.id,
        userId: currentUserId,
        isTyping: true
      });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop-typing', {
          connectionId: connection.id,
          userId: currentUserId,
          isTyping: false
        });
      }, 1000);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || sending) return;

    if (!isConnected) {
      toast.error('Connection lost. Please wait...');
      return;
    }

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage('');
    
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUserId,
          receiverId: otherUser.id,
          connectionId: connection.id,
          content: messageContent
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      setMessages(prev => [...prev, data.message]);
      
      if (socket && isConnected) {
        socket.emit('send-message', {
          connectionId: connection.id,
          receiverId: otherUser.id,
          senderId: currentUserId,
          message: data.message
        });

        socket.emit('stop-typing', {
          connectionId: connection.id,
          userId: currentUserId,
          isTyping: false
        });
        
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      }
      
      scrollToBottom();
    } catch (error) {
      console.error('❌ Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
      setNewMessage(messageContent);
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    if (socket && isConnected) {
      socket.emit('leave-connection', connection.id);
      socket.emit('stop-typing', {
        connectionId: connection.id,
        userId: currentUserId,
        isTyping: false
      });
    }
    onClose();
  };

  const getStatusText = () => {
    if (!isConnected) return 'Connecting...';
    if (isTyping) return <span className={styles.typingIndicator}>typing...</span>;
    return isOtherUserOnline ? 'Online' : 'Offline';
  };

  if (loading) {
    return (
      <div className={styles.chatWindow}>
        <div className={styles.chatHeader}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>
              {otherUser?.name?.charAt(0).toUpperCase() || '?'}
            </div>
            <div>
              <h3>{otherUser?.name || 'Unknown User'}</h3>
              <span className={styles.status}>Loading...</span>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={handleClose}>
            <XIcon size={24} />
          </button>
        </div>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.chatWindow}>
      <div className={styles.chatHeader}>
        <div className={styles.userInfo}>
          <div className={styles.avatar}>
            {otherUser?.name?.charAt(0).toUpperCase() || '?'}
          </div>
          <div>
            <h3>{otherUser?.name || 'Unknown User'}</h3>
            <span className={styles.status}>
              {getStatusText()}
            </span>
          </div>
        </div>
        <button className={styles.closeBtn} onClick={handleClose}>
          <XIcon size={24} />
        </button>
      </div>

      <div className={styles.messagesContainer}>
        {messages.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`${styles.message} ${
                message.senderId === currentUserId ? styles.sent : styles.received
              }`}
            >
              <div className={styles.messageContent}>
                <p>{message.content}</p>
                <span className={styles.timestamp}>
                  {new Date(message.createdAt).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className={styles.messageForm}>
        <input
          type="text"
          value={newMessage}
          onChange={handleTyping}
          placeholder={isConnected ? "Type a message..." : "Connecting..."}
          className={styles.messageInput}
          disabled={sending || !isConnected}
          autoFocus
        />
        <button
          type="submit"
          className={styles.sendBtn}
          disabled={!newMessage.trim() || sending || !isConnected}
          title={!isConnected ? "Connecting..." : sending ? "Sending..." : "Send message"}
        >
          <SendIcon size={20} />
        </button>
      </form>
    </div>
  );
}