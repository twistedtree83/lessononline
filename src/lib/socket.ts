import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

const SOCKET_SERVER_URL = 'http://localhost:3001';

class SocketClient {
  private socket: Socket | null = null;
  private sessionId: string | null = null;
  private userId: string | null = null;
  private role: 'teacher' | 'student' | null = null;
  private listeners: Map<string, Array<(...args: any[]) => void>> = new Map();

  constructor() {
    // Initialize socket connection
    this.init();
  }

  private init() {
    try {
      this.socket = io(SOCKET_SERVER_URL);
      
      this.socket.on('connect', () => {
        console.log('Connected to socket server');
        
        // If we have session info, rejoin after reconnection
        if (this.sessionId && this.userId && this.role) {
          this.joinSession(this.sessionId, this.userId, this.role);
        }
      });
      
      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        toast.error('Could not connect to real-time server. Some features may be limited.');
      });
      
      this.socket.on('disconnect', () => {
        console.log('Disconnected from socket server');
      });
      
    } catch (error) {
      console.error('Failed to initialize socket:', error);
    }
  }

  public joinSession(sessionId: string, userId: string, role: 'teacher' | 'student') {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }
    
    this.sessionId = sessionId;
    this.userId = userId;
    this.role = role;
    
    if (role === 'teacher') {
      this.socket.emit('teacher:join', { sessionId, teacherId: userId });
    } else {
      this.socket.emit('student:join', { sessionId, studentId: userId });
    }
  }

  public leaveSession() {
    if (!this.socket || !this.sessionId) return;
    
    this.socket.emit(`${this.role}:leave`, { 
      sessionId: this.sessionId, 
      userId: this.userId 
    });
    
    this.sessionId = null;
    this.userId = null;
    this.role = null;
  }

  public sendUnderstandingCheck(checkId: string, question: string = 'Do you understand?') {
    if (!this.socket || !this.sessionId || this.role !== 'teacher') {
      console.error('Cannot send understanding check: Invalid state');
      return;
    }
    
    return this.socket.emit('teacher:understanding-check', {
      sessionId: this.sessionId,
      checkId,
      question
    });
  }

  public sendUnderstandingResponse(checkId: string, response: 'understood' | 'not-understood') {
    if (!this.socket || !this.sessionId || this.role !== 'student') {
      console.error('Cannot send understanding response: Invalid state');
      return;
    }
    
    return this.socket.emit('student:understanding-response', {
      sessionId: this.sessionId,
      checkId,
      studentId: this.userId,
      response
    });
  }

  public on(event: string, callback: (...args: any[]) => void) {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }
    
    this.socket.on(event, callback);
    
    // Store the listener for potential reconnects
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
    
    return () => {
      this.off(event, callback);
    };
  }

  public off(event: string, callback?: (...args: any[]) => void) {
    if (!this.socket) return;
    
    if (callback) {
      this.socket.off(event, callback);
      
      // Remove specific listener from our records
      const listeners = this.listeners.get(event);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index !== -1) {
          listeners.splice(index, 1);
        }
      }
    } else {
      this.socket.off(event);
      this.listeners.delete(event);
    }
  }

  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.sessionId = null;
    this.userId = null;
    this.role = null;
    this.listeners.clear();
  }
}

// Export a singleton instance
export const socketClient = new SocketClient();