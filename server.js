import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Store active sessions
const sessions = new Map();

// Initialize a session when a teacher creates one
function initSession(sessionId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      participants: new Set(),
      teacher: null,
      currentCheck: null,
      responses: new Map()
    });
    console.log(`Session initialized: ${sessionId}`);
  }
  return sessions.get(sessionId);
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Handle teacher joining a session
  socket.on('teacher:join', ({ sessionId, teacherId }) => {
    console.log(`Teacher ${teacherId} joined session ${sessionId}`);
    
    const session = initSession(sessionId);
    session.teacher = socket.id;
    
    socket.join(sessionId);
    socket.emit('session:joined', { role: 'teacher', sessionId });
  });
  
  // Handle student joining a session
  socket.on('student:join', ({ sessionId, studentId }) => {
    console.log(`Student ${studentId} joined session ${sessionId}`);
    
    const session = initSession(sessionId);
    session.participants.add(studentId);
    
    socket.join(sessionId);
    socket.emit('session:joined', { role: 'student', sessionId });
    
    // Notify teacher about the new student
    if (session.teacher) {
      io.to(session.teacher).emit('student:joined', { 
        sessionId, 
        studentId,
        participantCount: session.participants.size
      });
    }
    
    // Send current check if one is active
    if (session.currentCheck) {
      socket.emit('understanding:check', session.currentCheck);
    }
  });
  
  // Handle understanding check from teacher
  socket.on('teacher:understanding-check', ({ sessionId, checkId, question }) => {
    console.log(`Teacher sent understanding check in session ${sessionId}`);
    
    const session = initSession(sessionId);
    session.currentCheck = { checkId, question, timestamp: new Date().toISOString() };
    session.responses = new Map();
    
    // Broadcast to all students in the session
    socket.to(sessionId).emit('understanding:check', session.currentCheck);
    
    // Return the current participants count as acknowledgment
    return { participantCount: session.participants.size };
  });
  
  // Handle understanding response from student
  socket.on('student:understanding-response', ({ sessionId, checkId, studentId, response }) => {
    console.log(`Student ${studentId} responded with ${response} to check ${checkId}`);
    
    const session = sessions.get(sessionId);
    if (!session || session.currentCheck?.checkId !== checkId) {
      return { error: 'Invalid session or check' };
    }
    
    // Save the response
    session.responses.set(studentId, response);
    
    // Calculate the stats
    const understoodCount = Array.from(session.responses.values())
      .filter(r => r === 'understood').length;
    const notUnderstoodCount = Array.from(session.responses.values())
      .filter(r => r === 'not-understood').length;
    
    const stats = {
      checkId,
      understood: understoodCount,
      notUnderstood: notUnderstoodCount,
      total: session.participants.size,
      responded: session.responses.size
    };
    
    // Notify the teacher
    if (session.teacher) {
      io.to(session.teacher).emit('understanding:stats', stats);
    }
    
    return { success: true };
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Clean up any sessions where this socket was the teacher
    for (const [sessionId, session] of sessions.entries()) {
      if (session.teacher === socket.id) {
        console.log(`Teacher left session ${sessionId}`);
        session.teacher = null;
      }
    }
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
});