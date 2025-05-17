import { supabase } from './supabase';

// Define types for our real-time events
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

// Channel subscription management
const channels = new Map<string, any>();

/**
 * Subscribe to a session channel
 */
export const joinSession = (sessionId: string, userId: string, role: 'teacher' | 'student') => {
  // Create a unique channel for this session
  const channelName = `session-${sessionId}`;
  
  // Check if we're already subscribed
  if (channels.has(channelName)) {
    return;
  }
  
  // Create a new channel subscription
  const channel = supabase.channel(channelName);
  
  // Subscribe to the channel
  channel
    .on('presence', { event: 'join' }, ({ key, newPresences }) => {
      // When someone joins, broadcast to the channel
      console.log('New presence join:', key, newPresences);
    })
    .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      console.log('Presence left:', key, leftPresences);
    })
    .on('broadcast', { event: 'participant-joined' }, (payload) => {
      console.log('Participant joined:', payload);
      // We'll handle this event in the components
    })
    .on('broadcast', { event: 'new-understanding-check' }, (payload) => {
      console.log('New understanding check:', payload);
      // We'll handle this event in the components
    })
    .on('broadcast', { event: 'understanding-update' }, (payload) => {
      console.log('Understanding update:', payload);
      // We'll handle this event in the components
    })
    .on('broadcast', { event: 'session-ended' }, (payload) => {
      console.log('Session ended:', payload);
      // We'll handle this event in the components
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Track presence
        await channel.track({ 
          user_id: userId, 
          role,
          online_at: new Date().toISOString() 
        });
        
        // Broadcast that a new participant has joined
        channel.send({
          type: 'broadcast',
          event: 'participant-joined',
          payload: {
            userId,
            role,
            timestamp: new Date().toISOString()
          }
        });
      }
    });
  
  // Store the channel reference
  channels.set(channelName, channel);
  
  return channel;
};

/**
 * Helper function for teachers to start an understanding check
 */
export const startUnderstandingCheck = (sessionId: string, teacherId: string, question?: string) => {
  const channelName = `session-${sessionId}`;
  const channel = channels.get(channelName);
  
  if (!channel) {
    console.error('Not subscribed to session channel');
    return;
  }
  
  // Create a poll ID
  const pollId = `poll-${Date.now()}`;
  
  // Broadcast the understanding check
  channel.send({
    type: 'broadcast',
    event: 'new-understanding-check',
    payload: {
      pollId,
      question: question || 'Do you understand?',
      timestamp: new Date().toISOString()
    }
  });
  
  return pollId;
};

/**
 * Helper function for students to respond to an understanding check
 */
export const respondToUnderstandingCheck = (pollId: string, userId: string, understood: boolean) => {
  // Extract session ID from the poll ID format (poll-{sessionId}-{timestamp})
  const sessionId = pollId.split('-')[1];
  const channelName = `session-${sessionId}`;
  const channel = channels.get(channelName);
  
  if (!channel) {
    console.error('Not subscribed to session channel');
    return;
  }
  
  // Broadcast the response
  channel.send({
    type: 'broadcast',
    event: 'understanding-update',
    payload: {
      pollId,
      response: {
        userId,
        understood,
        timestamp: new Date().toISOString()
      }
    }
  });
};

/**
 * Helper function to end a session
 */
export const endSession = (sessionId: string) => {
  const channelName = `session-${sessionId}`;
  const channel = channels.get(channelName);
  
  if (!channel) {
    console.error('Not subscribed to session channel');
    return;
  }
  
  // Broadcast that the session has ended
  channel.send({
    type: 'broadcast',
    event: 'session-ended',
    payload: {
      sessionId,
      timestamp: new Date().toISOString()
    }
  });
  
  // Clean up resources
  channel.unsubscribe();
  channels.delete(channelName);
};

/**
 * Helper function to disconnect from all channels
 */
export const disconnectAll = () => {
  for (const [name, channel] of channels.entries()) {
    channel.unsubscribe();
    channels.delete(name);
  }
};

/**
 * Fallback method to poll for understanding checks
 * Used when real-time fails for some reason
 */
export const pollForUnderstandingChecks = async (sessionId: string): Promise<UnderstandingPoll[]> => {
  try {
    // In a real implementation, this would fetch from a Supabase table
    // For this demo, we'll just return an empty array
    return [];
  } catch (error) {
    console.error('Error polling for understanding checks:', error);
    return [];
  }
};