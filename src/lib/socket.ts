import { io, Socket } from 'socket.io-client';

// Define types for our socket events
export interface UnderstandingPoll {
  pollId: string;
  question: string;
  timestamp: string;
}

export interface UnderstandingResponse {
  userId: string;
  understood: boolean;
  timestamp: string;
}

export interface UnderstandingUpdate {
  pollId: string;
  responses: UnderstandingResponse[];
}

export interface ParticipantJoined {
  userId: string;
  role: 'teacher' | 'student';
  timestamp: string;
}

// Create a singleton socket instance
let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io('http://localhost:3001');
    
    // Set up reconnection logic
    socket.on('connect', () => {
      console.log('Connected to Socket.io server');
    });
    
    socket.on('connect_error', (error) => {
      console.error('Socket.io connection error:', error);
    });
    
    socket.on('disconnect', (reason) => {
      console.log('Disconnected from Socket.io server:', reason);
    });
  }
  
  return socket;
};

// Helper function to join a session
export const joinSession = (sessionId: string, userId: string, role: 'teacher' | 'student') => {
  const socket = getSocket();
  socket.emit('join-session', { sessionId, userId, role });
};

// Helper function for teachers to start an understanding check
export const startUnderstandingCheck = (sessionId: string, teacherId: string, question?: string) => {
  const socket = getSocket();
  socket.emit('start-understanding-check', { sessionId, teacherId, question });
};

// Helper function for students to respond to an understanding check
export const respondToUnderstandingCheck = (pollId: string, userId: string, understood: boolean) => {
  const socket = getSocket();
  socket.emit('understanding-response', { pollId, userId, understood });
};

// Helper function to end a session
export const endSession = (sessionId: string) => {
  const socket = getSocket();
  socket.emit('end-session', { sessionId });
};

// Helper function to disconnect from the socket server
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Polling fallback for when WebSockets aren't available
export const pollForUnderstandingChecks = async (sessionId: string): Promise<UnderstandingPoll[]> => {
  try {
    const response = await fetch(`http://localhost:3001/sessions/${sessionId}/polls`);
    if (!response.ok) {
      throw new Error('Failed to fetch understanding checks');
    }
    return await response.json();
  } catch (error) {
    console.error('Error polling for understanding checks:', error);
    return [];
  }
};