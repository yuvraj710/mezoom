const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// Store active meetings and their participants
const activeMeetings = new Map();
const userSockets = new Map();

const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Handle authentication
    socket.on('authenticate', async (data) => {
      try {
        if (data.token) {
          const decoded = jwt.verify(data.token, process.env.JWT_SECRET);
          const result = await query(
            'SELECT id, username, email FROM users WHERE id = $1',
            [decoded.userId]
          );
          
          if (result.rows.length > 0) {
            socket.user = result.rows[0];
            userSockets.set(socket.user.id, socket.id);
            socket.emit('authenticated', { user: socket.user });
          }
        }
      } catch (error) {
        console.error('Socket authentication error:', error);
        socket.emit('auth_error', { message: 'Authentication failed' });
      }
    });

    // Handle joining a meeting room
    socket.on('join-room', async (data) => {
      try {
        const { meetingId, username } = data;
        
        if (!meetingId) {
          socket.emit('error', { message: 'Meeting ID is required' });
          return;
        }

        // Verify meeting exists and is active
        const meetingResult = await query(
          'SELECT * FROM meetings WHERE id = $1 AND status = $2',
          [meetingId, 'active']
        );

        if (meetingResult.rows.length === 0) {
          socket.emit('error', { message: 'Meeting not found or not active' });
          return;
        }

        const meeting = meetingResult.rows[0];

        // Leave any previous room
        if (socket.currentRoom) {
          socket.leave(socket.currentRoom);
          removeUserFromMeeting(socket.currentRoom, socket.id);
        }

        // Join the new room
        socket.join(meetingId);
        socket.currentRoom = meetingId;

        // Add user to meeting participants
        addUserToMeeting(meetingId, {
          socketId: socket.id,
          username: username || socket.user?.username || 'Guest',
          userId: socket.user?.id || null,
          isVideoEnabled: false,
          isAudioEnabled: false,
          joinedAt: new Date()
        });

        // Notify others in the room
        socket.to(meetingId).emit('user-joined', {
          socketId: socket.id,
          username: username || socket.user?.username || 'Guest',
          userId: socket.user?.id || null
        });

        // Send current participants to the new user
        const participants = activeMeetings.get(meetingId) || [];
        socket.emit('room-joined', {
          meetingId,
          participants: participants.filter(p => p.socketId !== socket.id)
        });

        // Send meeting info
        socket.emit('meeting-info', {
          id: meeting.id,
          title: meeting.title,
          description: meeting.description,
          isPrivate: meeting.is_private
        });

        console.log(`User ${socket.id} joined meeting ${meetingId}`);
      } catch (error) {
        console.error('Join room error:', error);
        socket.emit('error', { message: 'Failed to join meeting' });
      }
    });

    // Handle WebRTC signaling
    socket.on('offer', (data) => {
      socket.to(data.target).emit('offer', {
        offer: data.offer,
        sender: socket.id
      });
    });

    socket.on('answer', (data) => {
      socket.to(data.target).emit('answer', {
        answer: data.answer,
        sender: socket.id
      });
    });

    socket.on('ice-candidate', (data) => {
      socket.to(data.target).emit('ice-candidate', {
        candidate: data.candidate,
        sender: socket.id
      });
    });

    // Handle media state changes
    socket.on('media-state-change', (data) => {
      const { meetingId, isVideoEnabled, isAudioEnabled } = data;
      
      if (meetingId && activeMeetings.has(meetingId)) {
        const participants = activeMeetings.get(meetingId);
        const participant = participants.find(p => p.socketId === socket.id);
        
        if (participant) {
          participant.isVideoEnabled = isVideoEnabled;
          participant.isAudioEnabled = isAudioEnabled;
          
          // Broadcast to other participants
          socket.to(meetingId).emit('user-media-state-changed', {
            socketId: socket.id,
            isVideoEnabled,
            isAudioEnabled
          });
        }
      }
    });

    // Handle chat messages
    socket.on('chat-message', async (data) => {
      try {
        const { meetingId, message, messageType = 'text' } = data;
        
        if (!meetingId || !message) {
          socket.emit('error', { message: 'Meeting ID and message are required' });
          return;
        }

        const messageData = {
          id: Date.now().toString(),
          senderId: socket.user?.id || null,
          senderName: socket.user?.username || 'Guest',
          message,
          messageType,
          timestamp: new Date().toISOString(),
          socketId: socket.id
        };

        // Save message to database if user is authenticated
        if (socket.user) {
          await query(
            'INSERT INTO chat_messages (meeting_id, user_id, message, message_type, created_at) VALUES ($1, $2, $3, $4, NOW())',
            [meetingId, socket.user.id, message, messageType]
          );
        }

        // Broadcast message to all participants in the room
        io.to(meetingId).emit('chat-message', messageData);

        console.log(`Chat message in ${meetingId}: ${message}`);
      } catch (error) {
        console.error('Chat message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle screen sharing
    socket.on('screen-share-start', (data) => {
      socket.to(data.meetingId).emit('screen-share-started', {
        socketId: socket.id,
        username: socket.user?.username || 'Guest'
      });
    });

    socket.on('screen-share-stop', (data) => {
      socket.to(data.meetingId).emit('screen-share-stopped', {
        socketId: socket.id
      });
    });

    // Handle user typing indicator
    socket.on('typing-start', (data) => {
      socket.to(data.meetingId).emit('user-typing', {
        socketId: socket.id,
        username: socket.user?.username || 'Guest',
        isTyping: true
      });
    });

    socket.on('typing-stop', (data) => {
      socket.to(data.meetingId).emit('user-typing', {
        socketId: socket.id,
        username: socket.user?.username || 'Guest',
        isTyping: false
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      
      if (socket.currentRoom) {
        removeUserFromMeeting(socket.currentRoom, socket.id);
        
        // Notify others in the room
        socket.to(socket.currentRoom).emit('user-left', {
          socketId: socket.id,
          username: socket.user?.username || 'Guest'
        });
      }

      // Remove from user sockets map
      if (socket.user) {
        userSockets.delete(socket.user.id);
      }
    });
  });
};

// Helper functions
const addUserToMeeting = (meetingId, user) => {
  if (!activeMeetings.has(meetingId)) {
    activeMeetings.set(meetingId, []);
  }
  
  const participants = activeMeetings.get(meetingId);
  const existingIndex = participants.findIndex(p => p.socketId === user.socketId);
  
  if (existingIndex >= 0) {
    participants[existingIndex] = user;
  } else {
    participants.push(user);
  }
};

const removeUserFromMeeting = (meetingId, socketId) => {
  if (activeMeetings.has(meetingId)) {
    const participants = activeMeetings.get(meetingId);
    const filteredParticipants = participants.filter(p => p.socketId !== socketId);
    
    if (filteredParticipants.length === 0) {
      activeMeetings.delete(meetingId);
    } else {
      activeMeetings.set(meetingId, filteredParticipants);
    }
  }
};

// Get active meetings info
const getActiveMeetings = () => {
  const meetings = [];
  for (const [meetingId, participants] of activeMeetings.entries()) {
    meetings.push({
      meetingId,
      participantCount: participants.length,
      participants: participants.map(p => ({
        username: p.username,
        isVideoEnabled: p.isVideoEnabled,
        isAudioEnabled: p.isAudioEnabled
      }))
    });
  }
  return meetings;
};

module.exports = {
  setupSocketHandlers,
  getActiveMeetings,
  activeMeetings
};
