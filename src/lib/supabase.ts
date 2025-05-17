import { createClient } from '@supabase/supabase-js';

// Get environment variables with fallbacks to prevent URL construction errors
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if we have valid credentials
const hasValidCredentials = supabaseUrl !== '' && supabaseAnonKey !== '';

// Initialize the Supabase client or create a mock version
let supabase;

if (hasValidCredentials) {
  // Create real Supabase client when credentials are available
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log('Supabase client initialized successfully');
} else {
  // Log warning for debugging
  console.warn(
    'Supabase client not initialized due to missing or invalid credentials. Using mock database instead.'
  );
  
  // The client will be replaced by mockDatabase for local development
  supabase = {
    auth: {
      signInWithOtp: async () => ({ error: new Error('Supabase not initialized - using mock data') }),
      signOut: async () => ({ error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
    },
    from: () => ({
      insert: () => ({
        select: () => ({
          single: () => ({ data: null, error: new Error('Supabase not initialized - using mock data') })
        })
      }),
      select: () => ({ data: [], error: null }),
      update: () => ({ data: null, error: null }),
    }),
  };
}

export { supabase };

export type User = {
  id: string;
  email: string;
  role: 'teacher' | 'student';
  name?: string;
};

export type Lesson = {
  id: string;
  title: string;
  content: {
    introduction: string;
    body: string;
    conclusion: string;
  };
  teacher_id: string;
  created_at: string;
};

export type Session = {
  id: string;
  lesson_id: string;
  class_code: string;
  active: boolean;
  created_at: string;
};

export type Participant = {
  id: string;
  session_id: string;
  user_id: string;
  joined_at: string;
};

// Mock database service for development without authentication
export const mockDatabase = {
  lessons: [
    {
      id: 'lesson-1',
      title: 'Introduction to Mathematics',
      content: {
        introduction: '<p>This lesson introduces basic mathematical concepts.</p>',
        body: '<p>We will cover the following topics:</p><ul><li>Numbers and counting</li><li>Addition and subtraction</li><li>Multiplication and division</li></ul>',
        conclusion: '<p>Students will understand the foundations of mathematics after this lesson.</p>'
      },
      teacher_id: 'teacher-123',
      created_at: new Date().toISOString()
    },
    {
      id: 'lesson-2',
      title: 'History of Australia',
      content: {
        introduction: '<p>An overview of Australian history from indigenous cultures to modern times.</p>',
        body: '<p>Key periods include:</p><ul><li>Indigenous Australian history</li><li>European exploration and settlement</li><li>Federation and nation-building</li><li>Modern Australia</li></ul>',
        conclusion: '<p>Understanding Australia\'s past helps us shape its future.</p>'
      },
      teacher_id: 'teacher-123',
      created_at: new Date().toISOString()
    }
  ],
  sessions: [],
  participants: [],
  
  // CRUD operations
  createLesson(lesson) {
    const newLesson = {
      ...lesson,
      id: `lesson-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    this.lessons.push(newLesson);
    return { data: newLesson, error: null };
  },
  
  getLessons(teacherId) {
    const lessons = this.lessons.filter(lesson => lesson.teacher_id === teacherId);
    return { data: lessons, error: null };
  },
  
  createSession(session) {
    const newSession = {
      ...session,
      id: `session-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    this.sessions.push(newSession);
    return { data: newSession, error: null };
  },
  
  getSession(sessionId) {
    const session = this.sessions.find(s => s.id === sessionId);
    return { data: session || null, error: session ? null : new Error('Session not found') };
  },
  
  updateSession(sessionId, updates) {
    const index = this.sessions.findIndex(s => s.id === sessionId);
    if (index >= 0) {
      this.sessions[index] = { ...this.sessions[index], ...updates };
      return { data: this.sessions[index], error: null };
    }
    return { data: null, error: new Error('Session not found') };
  },
  
  addParticipant(participant) {
    const newParticipant = {
      ...participant,
      id: `participant-${Date.now()}`,
      joined_at: new Date().toISOString()
    };
    this.participants.push(newParticipant);
    return { data: newParticipant, error: null };
  },
  
  getParticipants(sessionId) {
    const participants = this.participants.filter(p => p.session_id === sessionId);
    return { data: participants, error: null };
  }
};