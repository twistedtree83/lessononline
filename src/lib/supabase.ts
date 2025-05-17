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
    painPoints?: string;
    vocabularyNotes?: string;
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

export type UnderstandingCheck = {
  id: string;
  session_id: string;
  timestamp: string;
  question: string;
};

export type UnderstandingResponse = {
  id: string;
  check_id: string;
  participant_id: string;
  response: 'understood' | 'not-understood';
  timestamp: string;
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
        conclusion: '<p>Students will understand the foundations of mathematics after this lesson.</p>',
        painPoints: `<p>Students commonly struggle with these concepts:</p>
          <ul>
            <li><strong>Abstract thinking</strong> - Some students find it difficult to transition from concrete examples to abstract mathematical concepts</li>
            <li><strong>Times tables</strong> - Memorization of multiplication facts can be challenging</li>
            <li><strong>Place value</strong> - Understanding how the position of digits affects their value</li>
          </ul>`,
        vocabularyNotes: `<p>Key terms to introduce and explain:</p>
          <ul>
            <li><strong>Sum</strong> - The result of adding two or more numbers</li>
            <li><strong>Difference</strong> - The result of subtracting one number from another</li>
            <li><strong>Product</strong> - The result of multiplying two or more numbers</li>
            <li><strong>Quotient</strong> - The result of dividing one number by another</li>
          </ul>`
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
        conclusion: '<p>Understanding Australia\'s past helps us shape its future.</p>',
        painPoints: `<p>Students may struggle with these aspects:</p>
          <ul>
            <li><strong>Timeline comprehension</strong> - Understanding the chronology and overlap of historical events</li>
            <li><strong>Cultural sensitivity</strong> - Approaching indigenous history with appropriate context</li>
            <li><strong>Colonization perspectives</strong> - Balancing different viewpoints on settlement</li>
          </ul>`,
        vocabularyNotes: `<p>Important terminology:</p>
          <ul>
            <li><strong>Dreamtime</strong> - The Aboriginal understanding of the world's creation</li>
            <li><strong>Federation</strong> - The process by which the six colonies joined to form Australia in 1901</li>
            <li><strong>ANZAC</strong> - Australian and New Zealand Army Corps, commemorated for their service</li>
            <li><strong>Terra Nullius</strong> - The legal concept that Australia was unoccupied before European settlement</li>
          </ul>`
      },
      teacher_id: 'teacher-123',
      created_at: new Date().toISOString()
    }
  ],
  sessions: [],
  participants: [],
  understandingChecks: [],
  understandingResponses: [],
  
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
  },
  
  createUnderstandingCheck(sessionId, question = "Do you understand?") {
    const newCheck = {
      id: `check-${Date.now()}`,
      session_id: sessionId,
      timestamp: new Date().toISOString(),
      question
    };
    this.understandingChecks.push(newCheck);
    return { data: newCheck, error: null };
  },
  
  getLatestUnderstandingCheck(sessionId) {
    const checks = this.understandingChecks
      .filter(check => check.session_id === sessionId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return { data: checks[0] || null, error: null };
  },
  
  respondToUnderstandingCheck(checkId, participantId, response) {
    const newResponse = {
      id: `response-${Date.now()}`,
      check_id: checkId,
      participant_id: participantId,
      response,
      timestamp: new Date().toISOString()
    };
    this.understandingResponses.push(newResponse);
    return { data: newResponse, error: null };
  },
  
  getUnderstandingResponses(checkId) {
    const responses = this.understandingResponses.filter(r => r.check_id === checkId);
    return { data: responses, error: null };
  },
  
  getUnderstandingStats(checkId, sessionId) {
    const responses = this.understandingResponses.filter(r => r.check_id === checkId);
    const participants = this.participants.filter(p => p.session_id === sessionId);
    
    const understood = responses.filter(r => r.response === 'understood').length;
    const notUnderstood = responses.filter(r => r.response === 'not-understood').length;
    
    return { 
      data: {
        understood,
        notUnderstood,
        total: participants.length,
        respondedCount: responses.length
      }, 
      error: null 
    };
  }
};