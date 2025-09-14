const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client', 'build')));

// Simple meeting storage (in-memory for demo)
const meetings = new Map();
const participants = new Map();

// API Routes
app.post('/api/meetings/create', (req, res) => {
  const meetingId = Math.random().toString(36).substring(2, 15);
  const meeting = {
    id: meetingId,
    title: req.body.title || 'New Meeting',
    created_at: new Date().toISOString(),
    status: 'active'
  };
  
  meetings.set(meetingId, meeting);
  participants.set(meetingId, []);
  
  res.json({
    message: 'Meeting created successfully',
    meeting: {
      ...meeting,
      joinUrl: `http://localhost:3000/meeting/${meetingId}`
    }
  });
});

app.get('/api/meetings/:id', (req, res) => {
  const meeting = meetings.get(req.params.id);
  if (!meeting) {
    return res.status(404).json({ error: 'Meeting not found' });
  }
  res.json({ meeting });
});

app.post('/api/meetings/:id/join', (req, res) => {
  const meeting = meetings.get(req.params.id);
  if (!meeting) {
    return res.status(404).json({ error: 'Meeting not found' });
  }
  res.json({ message: 'Successfully joined meeting', meeting });
});

// Socket.IO handlers
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (data) => {
    const { meetingId, username } = data;
    socket.join(meetingId);
    socket.currentRoom = meetingId;
    
    // Add participant
    const roomParticipants = participants.get(meetingId) || [];
    roomParticipants.push({
      socketId: socket.id,
      username: username || 'Guest',
      isVideoEnabled: false,
      isAudioEnabled: false
    });
    participants.set(meetingId, roomParticipants);
    
    // Notify others
    socket.to(meetingId).emit('user-joined', {
      socketId: socket.id,
      username: username || 'Guest'
    });
    
    // Send current participants
    socket.emit('room-joined', {
      meetingId,
      participants: roomParticipants.filter(p => p.socketId !== socket.id)
    });
  });

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

  socket.on('chat-message', (data) => {
    const messageData = {
      id: Date.now().toString(),
      senderName: 'Guest',
      message: data.message,
      timestamp: new Date().toISOString(),
      socketId: socket.id
    };
    io.to(data.meetingId).emit('chat-message', messageData);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    if (socket.currentRoom) {
      socket.to(socket.currentRoom).emit('user-left', {
        socketId: socket.id
      });
    }
  });
});

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Open http://localhost:${PORT} in your browser`);
});
