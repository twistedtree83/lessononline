import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { LessonOutline } from '../components/LessonOutline';
import { UnderstandingCheck } from '../components/UnderstandingCheck';
import { mockDatabase, User, Lesson, Session } from '../lib/supabase';
import { ArrowLeft, Wifi, WifiOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  getSocket, 
  joinSession, 
  respondToUnderstandingCheck, 
  pollForUnderstandingChecks,
  UnderstandingPoll
} from '../lib/socket';

type StudentSessionProps = {
  user: User;
};

export default function StudentSession({ user }: StudentSessionProps) {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [currentPoll, setCurrentPoll] = useState<UnderstandingPoll | null>(null);
  const [userResponse, setUserResponse] = useState<boolean | undefined>(undefined);
  const [pollingInterval, setPollingInterval] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionId) {
      fetchSessionData(sessionId);
      
      // Connect to socket.io server
      const socket = getSocket();
      
      // Join the session room
      joinSession(sessionId, user.id, 'student');
      
      // Set up socket event listeners
      socket.on('connect', () => {
        setSocketConnected(true);
        // Clear any polling interval if we're connected via WebSockets
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
      });
      
      socket.on('disconnect', () => {
        setSocketConnected(false);
        // Start polling as a fallback when WebSockets are disconnected
        startPolling();
      });
      
      socket.on('new-understanding-check', (poll: UnderstandingPoll) => {
        setCurrentPoll(poll);
        setUserResponse(undefined);
        toast.success('New understanding check from your teacher');
      });
      
      socket.on('session-ended', () => {
        toast.info('This session has ended');
        if (session) {
          setSession({ ...session, active: false });
        }
      });
      
      // Cleanup function
      return () => {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('new-understanding-check');
        socket.off('session-ended');
        
        if (pollingInterval) {
          clearInterval(pollingInterval);
        }
      };
    }
  }, [sessionId, user.id]);

  // Fallback polling mechanism when WebSockets aren't available
  const startPolling = () => {
    if (pollingInterval) return;
    
    const interval = setInterval(() => {
      if (!sessionId || socketConnected) return;
      
      checkForNewUnderstandingPolls();
    }, 5000) as unknown as number;
    
    setPollingInterval(interval);
  };

  const checkForNewUnderstandingPolls = async () => {
    if (!sessionId) return;
    
    try {
      const polls = await pollForUnderstandingChecks(sessionId);
      if (polls.length > 0) {
        // Find the most recent poll
        const latestPoll = polls.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )[0];
        
        // Only update if this is a new poll
        if (!currentPoll || latestPoll.pollId !== currentPoll.pollId) {
          setCurrentPoll(latestPoll);
          setUserResponse(undefined);
          toast.success('New understanding check from your teacher');
        }
      }
    } catch (error) {
      console.error('Error checking for understanding polls:', error);
    }
  };

  const fetchSessionData = async (sid: string) => {
    try {
      // Find the session in our mock database
      const mockSession = mockDatabase.sessions.find(s => s.id === sid);
      
      if (!mockSession) {
        // If no session found in mock DB, create one for demo purposes
        const mockLesson = mockDatabase.lessons[0];
        
        const newSession = {
          id: sid,
          lesson_id: mockLesson.id,
          class_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
          active: true,
          created_at: new Date().toISOString()
        };
        
        mockDatabase.sessions.push(newSession);
        setSession(newSession);
        setLesson(mockLesson);
        
        // Add the student as a participant
        mockDatabase.participants.push({
          id: `participant-${Date.now()}`,
          session_id: sid,
          user_id: user.id,
          joined_at: new Date().toISOString()
        });
      } else {
        setSession(mockSession);
        
        // Find the associated lesson
        const mockLesson = mockDatabase.lessons.find(l => l.id === mockSession.lesson_id);
        setLesson(mockLesson || mockDatabase.lessons[0]);
        
        // Ensure the student is a participant
        const isParticipant = mockDatabase.participants.some(
          p => p.session_id === sid && p.user_id === user.id
        );
        
        if (!isParticipant) {
          mockDatabase.participants.push({
            id: `participant-${Date.now()}`,
            session_id: sid,
            user_id: user.id,
            joined_at: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      toast.error('Failed to load session data');
      console.error('Error fetching session data:', error);
      navigate('/student');
    } finally {
      setLoading(false);
    }
  };

  const handleUnderstandingResponse = (understood: boolean) => {
    if (!currentPoll) return;
    
    // Send response to the server
    respondToUnderstandingCheck(currentPoll.pollId, user.id, understood);
    
    // Update local state
    setUserResponse(understood);
    
    toast.success('Response submitted');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-lg font-semibold">Loading session...</p>
      </div>
    );
  }

  // If no lesson found, use a default one
  const displayLesson = lesson || {
    id: 'default-lesson',
    title: 'Sample Lesson',
    content: {
      introduction: '<p>This is a sample introduction for demonstration purposes.</p>',
      body: '<p>This is the main content of the sample lesson.</p><ul><li>Point 1</li><li>Point 2</li><li>Point 3</li></ul>',
      conclusion: '<p>This concludes our sample lesson.</p>'
    },
    teacher_id: 'teacher-123',
    created_at: new Date().toISOString()
  };

  const displaySession = session || {
    id: sessionId || 'sample-session',
    lesson_id: displayLesson.id,
    class_code: 'SAMPLE',
    active: true,
    created_at: new Date().toISOString()
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/student')}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{displayLesson.title}</h1>
              {!displaySession.active && (
                <p className="text-sm text-amber-600">This session has ended</p>
              )}
            </div>
          </div>
          
          {socketConnected ? (
            <div className="flex items-center text-green-600">
              <Wifi className="h-4 w-4 mr-1" />
              <span className="text-sm">Connected</span>
            </div>
          ) : (
            <div className="flex items-center text-amber-600">
              <WifiOff className="h-4 w-4 mr-1" />
              <span className="text-sm">Offline</span>
            </div>
          )}
        </div>

        {currentPoll && (
          <div className="mb-6">
            <UnderstandingCheck 
              poll={currentPoll}
              onRespond={handleUnderstandingResponse}
              userResponse={userResponse}
            />
          </div>
        )}

        <LessonOutline lesson={displayLesson} />
      </div>
    </div>
  );
}