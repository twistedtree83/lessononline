import express from 'express';
import http from 'node:http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Store active sessions and understanding polls
const activeSessions = new Map();
const understandingPolls = new Map();

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  // Join a session room
  socket.on('join-session', ({ sessionId, userId, role }) => {
    socket.join(sessionId);
    console.log(`${role} ${userId} joined session ${sessionId}`);
    
    // If this is a teacher, initialize the session
    if (role === 'teacher') {
      activeSessions.set(sessionId, { teacherId: userId });
      console.log(`Teacher initialized session ${sessionId}`);
    }
    
    // Notify everyone in the room about the new participant
    io.to(sessionId).emit('participant-joined', { 
      userId, 
      role,
      timestamp: new Date().toISOString()
    });
  });
  
  // Teacher starts an understanding check
  socket.on('start-understanding-check', ({ sessionId, teacherId, question }) => {
    console.log(`Teacher ${teacherId} started understanding check in session ${sessionId}`);
    
    // Create a new understanding poll
    const pollId = `poll-${Date.now()}`;
    understandingPolls.set(pollId, {
      sessionId,
      teacherId,
      question: question || 'Do you understand?',
      responses: [],
      timestamp: new Date().toISOString()
    });
    
    // Notify all students in the session
    io.to(sessionId).emit('new-understanding-check', {
      pollId,
      question: question || 'Do you understand?',
      timestamp: new Date().toISOString()
    });
  });
  
  // Student responds to understanding check
  socket.on('understanding-response', ({ pollId, userId, understood }) => {
    console.log(`Student ${userId} responded to poll ${pollId}: ${understood ? 'understood' : 'did not understand'}`);
    
    const poll = understandingPolls.get(pollId);
    if (poll) {
      // Add response
      poll.responses.push({
        userId,
        understood,
        timestamp: new Date().toISOString()
      });
      
      // Update the poll
      understandingPolls.set(pollId, poll);
      
      // Notify the teacher
      io.to(poll.sessionId).emit('understanding-update', {
        pollId,
        responses: poll.responses
      });
    }
  });
  
  // End session
  socket.on('end-session', ({ sessionId }) => {
    console.log(`Session ${sessionId} ended`);
    io.to(sessionId).emit('session-ended');
    activeSessions.delete(sessionId);
    
    // Clean up any polls for this session
    for (const [pollId, poll] of understandingPolls.entries()) {
      if (poll.sessionId === sessionId) {
        understandingPolls.delete(pollId);
      }
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Fallback route for checking server status
app.get('/status', (req, res) => {
  res.json({ status: 'Socket.io server is running' });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
});