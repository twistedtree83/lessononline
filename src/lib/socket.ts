import { mockDatabase, isMockDatabase, supabase } from "./supabase";

export type UnderstandingPoll = {
  pollId: string;
  question: string;
  timestamp: string;
};

export type UnderstandingResponse = {
  userId: string;
  pollId: string;
  understood: boolean;
  timestamp: string;
};

export type ParticipantJoined = {
  userId: string;
  role: 'teacher' | 'student';
  timestamp: string;
};

/**
 * Join a session and subscribe to realtime updates
 */
export function joinSession(sessionId: string, userId: string, role: 'teacher' | 'student') {
  if (isMockDatabase) {
    console.log(`Mock: ${role} ${userId} joined session ${sessionId}`);
    return null;
  }

  try {
    // Broadcast join event to all clients
    supabase
      .channel(`session-${sessionId}`)
      .on('broadcast', { event: 'participant-joined' }, (payload) => {
        console.log('Participant joined event:', payload);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Send a join event so others know we're here
          const channel = supabase.channel(`session-${sessionId}`);
          const message = {
            userId,
            role,
            timestamp: new Date().toISOString()
          };
          
          channel.send({
            type: 'broadcast',
            event: 'participant-joined',
            payload: message
          });
        }
      });
    
    return sessionId;
  } catch (error) {
    console.error('Error joining session:', error);
    return null;
  }
}

/**
 * Start a new understanding check within a session
 */
export function startUnderstandingCheck(sessionId: string, teacherId: string, question = "Do you understand?") {
  const pollId = `poll-${Date.now()}`;
  const poll: UnderstandingPoll = {
    pollId,
    question,
    timestamp: new Date().toISOString()
  };

  if (isMockDatabase) {
    console.log(`Mock: Started understanding check in session ${sessionId}`);
    // Add to mock database
    mockDatabase.createUnderstandingCheck(sessionId, question);
    return pollId;
  }

  try {
    // Broadcast to all participants in the session
    supabase
      .channel(`session-${sessionId}`)
      .send({
        type: 'broadcast',
        event: 'new-understanding-check',
        payload: poll
      });

    return pollId;
  } catch (error) {
    console.error('Error starting understanding check:', error);
    return pollId;
  }
}

/**
 * Submit a response to an understanding check
 */
export function respondToUnderstandingCheck(pollId: string, userId: string, understood: boolean) {
  const response: UnderstandingResponse = {
    userId,
    pollId,
    understood,
    timestamp: new Date().toISOString()
  };

  if (isMockDatabase) {
    console.log(`Mock: User ${userId} responded to poll ${pollId} with ${understood ? 'understood' : 'not understood'}`);
    // Add to mock database with dummy participant id
    mockDatabase.respondToUnderstandingCheck(
      pollId, 
      `participant-${userId}`, 
      understood ? 'understood' : 'not-understood'
    );
    return true;
  }

  try {
    // Find the session ID from the poll ID (in a real app, we'd store this mapping)
    const sessionId = pollId.replace('poll-', 'session-');
    
    // Broadcast response to the teacher
    supabase
      .channel(`session-${sessionId}`)
      .send({
        type: 'broadcast',
        event: 'understanding-update',
        payload: {
          pollId,
          response
        }
      });
    
    return true;
  } catch (error) {
    console.error('Error responding to understanding check:', error);
    return false;
  }
}

/**
 * End a session, notifying all participants
 */
export function endSession(sessionId: string) {
  if (isMockDatabase) {
    console.log(`Mock: Session ${sessionId} ended`);
    return true;
  }

  try {
    // Broadcast session end event
    supabase
      .channel(`session-${sessionId}`)
      .send({
        type: 'broadcast',
        event: 'session-ended',
        payload: {
          sessionId,
          timestamp: new Date().toISOString()
        }
      });
    
    return true;
  } catch (error) {
    console.error('Error ending session:', error);
    return false;
  }
}

/**
 * Fallback polling method for when realtime isn't available
 */
export async function pollForUnderstandingChecks(sessionId: string): Promise<UnderstandingPoll[]> {
  // In a real app, we'd fetch from the database
  // Here we'll just return from our mock database
  const result = mockDatabase.getLatestUnderstandingCheck(sessionId);
  
  if (result.data) {
    const check = result.data;
    return [{
      pollId: check.id,
      question: check.question,
      timestamp: check.timestamp
    }];
  }
  
  return [];
}