import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, token } = useAuth();

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
      autoConnect: true,
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setIsConnected(true);
      
      // Authenticate if user is logged in
      if (token) {
        newSocket.emit('authenticate', { token });
      }
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('authenticated', (data) => {
      console.log('Socket authenticated:', data);
    });

    newSocket.on('auth_error', (data) => {
      console.error('Socket auth error:', data);
      toast.error('Authentication failed');
    });

    newSocket.on('error', (data) => {
      console.error('Socket error:', data);
      toast.error(data.message || 'Connection error');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [token]);

  // Re-authenticate when user changes
  useEffect(() => {
    if (socket && token) {
      socket.emit('authenticate', { token });
    }
  }, [socket, token]);

  const joinRoom = (meetingId, username) => {
    if (socket) {
      socket.emit('join-room', { meetingId, username });
    }
  };

  const leaveRoom = () => {
    if (socket) {
      socket.emit('leave-room');
    }
  };

  const sendMessage = (meetingId, message, messageType = 'text') => {
    if (socket) {
      socket.emit('chat-message', { meetingId, message, messageType });
    }
  };

  const sendOffer = (target, offer) => {
    if (socket) {
      socket.emit('offer', { target, offer });
    }
  };

  const sendAnswer = (target, answer) => {
    if (socket) {
      socket.emit('answer', { target, answer });
    }
  };

  const sendIceCandidate = (target, candidate) => {
    if (socket) {
      socket.emit('ice-candidate', { target, candidate });
    }
  };

  const changeMediaState = (meetingId, isVideoEnabled, isAudioEnabled) => {
    if (socket) {
      socket.emit('media-state-change', { meetingId, isVideoEnabled, isAudioEnabled });
    }
  };

  const startScreenShare = (meetingId) => {
    if (socket) {
      socket.emit('screen-share-start', { meetingId });
    }
  };

  const stopScreenShare = (meetingId) => {
    if (socket) {
      socket.emit('screen-share-stop', { meetingId });
    }
  };

  const startTyping = (meetingId) => {
    if (socket) {
      socket.emit('typing-start', { meetingId });
    }
  };

  const stopTyping = (meetingId) => {
    if (socket) {
      socket.emit('typing-stop', { meetingId });
    }
  };

  const value = {
    socket,
    isConnected,
    joinRoom,
    leaveRoom,
    sendMessage,
    sendOffer,
    sendAnswer,
    sendIceCandidate,
    changeMediaState,
    startScreenShare,
    stopScreenShare,
    startTyping,
    stopTyping
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
