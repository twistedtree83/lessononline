import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ClassCodeDisplay } from '../components/ClassCodeDisplay';
import { LessonOutline } from '../components/LessonOutline';
import { UnderstandingResults } from '../components/UnderstandingCheck';
import { mockDatabase, User, Lesson, Session, Participant } from '../lib/supabase';
import { ArrowLeft, Users, X, HelpCircle, Wifi, WifiOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  getSocket, 
  joinSession, 
  startUnderstandingCheck, 
  endSession, 
  UnderstandingResponse,
  ParticipantJoined
} from '../lib/socket';

type TeacherSessionProps = {
  user: User;
};

export default function TeacherSession({ user }: TeacherSessionProps) {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [currentPollId, setCurrentPollId] = useState<string | null>(null);
  const [pollResponses, setPollResponses] = useState<UnderstandingResponse[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionId) {
      fetchSessionData(sessionId);
      
      // Connect to socket.io server
      const socket = getSocket();
      
      // Join the session room
      joinSession(sessionId, user.id, 'teacher');
      
      // Set up socket event listeners
      socket.on('connect', () => {
        setSocketConnected(true);
        toast.success('Connected to real-time server');
      });
      
      socket.on('disconnect', () => {
        setSocketConnected(false);
        toast.error('Disconnected from real-time server');
      });
      
      socket.on('participant-joined', (data: ParticipantJoined) => {
        if (data.role === 'student') {
          // Add the new participant
          const newParticipant: Participant = {
            id: `participant-${Date.now()}`,
            session_id: sessionId,
            user_id: data.userId,
            joined_at: data.timestamp
          };
          
          setParticipants(prev => {
            // Check if this participant is already in the list
            if (prev.some(p => p.user_id === data.userId)) {
              return prev;
            }
            return [...prev, newParticipant];
          });
          
          toast.success('A new student has joined the session');
        }
      });
      
      socket.on('understanding-update', (data: { pollId: string, responses: UnderstandingResponse[] }) => {
        if (data.pollId === currentPollId) {
          setPollResponses(data.responses);
        }
      });
      
      // Cleanup function
      return () => {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('participant-joined');
        socket.off('understanding-update');
      };
    }
  }, [sessionId, user.id, currentPollId]);

  const fetchSessionData = async (sid: string) => {
    try {
      // Find the session in our mock database
      const mockSession = mockDatabase.sessions.find(s => s.id === sid);
      
      if (!mockSession) {
        // If no session found in mock DB, create one with the class code
        const classCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const mockLesson = mockDatabase.lessons[0];
        
        const newSession = {
          id: sid,
          lesson_id: mockLesson.id,
          class_code: classCode,
          active: true,
          created_at: new Date().toISOString()
        };
        
        mockDatabase.sessions.push(newSession);
        setSession(newSession);
        setLesson(mockLesson);
      } else {
        setSession(mockSession);
        
        // Find the associated lesson
        const mockLesson = mockDatabase.lessons.find(l => l.id === mockSession.lesson_id);
        setLesson(mockLesson || null);
      }
      
      // Get participants (will be empty initially)
      const mockParticipants = mockDatabase.participants.filter(p => p.session_id === sid);
      setParticipants(mockParticipants);
    } catch (error) {
      toast.error('Failed to load session data');
      console.error('Error fetching session data:', error);
      navigate('/teacher');
    } finally {
      setLoading(false);
    }
  };

  const handleEndSession = async () => {
    if (!session || !sessionId) return;

    try {
      const updatedSession = { ...session, active: false };
      
      // Update in our mock database
      const sessionIndex = mockDatabase.sessions.findIndex(s => s.id === session.id);
      if (sessionIndex >= 0) {
        mockDatabase.sessions[sessionIndex] = updatedSession;
      }
      
      // Notify all connected clients that the session has ended
      endSession(sessionId);
      
      setSession(updatedSession);
      toast.success('Session ended successfully');
      navigate('/teacher');
    } catch (error) {
      toast.error('Failed to end session');
      console.error('Error ending session:', error);
    }
  };

  const handleStartUnderstandingCheck = () => {
    if (!sessionId) return;
    
    // Start a new understanding check
    startUnderstandingCheck(sessionId, user.id);
    
    // Set the current poll ID (in a real app, this would come from the server)
    const newPollId = `poll-${Date.now()}`;
    setCurrentPollId(newPollId);
    setPollResponses([]);
    
    toast.success('Understanding check started');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-lg font-semibold">Loading session...</p>
      </div>
    );
  }

  // If no lesson found in mock DB, use a default one
  const displayLesson = lesson || {
    id: 'default-lesson',
    title: 'Sample Lesson',
    content: {
      introduction: '<p>This is a sample introduction for demonstration purposes.</p>',
      body: '<p>This is the main content of the sample lesson.</p><ul><li>Point 1</li><li>Point 2</li><li>Point 3</li></ul>',
      conclusion: '<p>This concludes our sample lesson.</p>'
    },
    teacher_id: user.id,
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
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/teacher')}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">{displayLesson.title}</h1>
          </div>
          <div className="flex items-center space-x-2">
            {socketConnected ? (
              <div className="flex items-center text-green-600 mr-4">
                <Wifi className="h-4 w-4 mr-1" />
                <span className="text-sm">Connected</span>
              </div>
            ) : (
              <div className="flex items-center text-amber-600 mr-4">
                <WifiOff className="h-4 w-4 mr-1" />
                <span className="text-sm">Offline</span>
              </div>
            )}
            <Button variant="destructive" onClick={handleEndSession}>
              <X className="h-4 w-4 mr-2" />
              End Session
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <LessonOutline lesson={displayLesson} />
            
            <div className="mt-6">
              <Button 
                onClick={handleStartUnderstandingCheck}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={!socketConnected}
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                Check Understanding
              </Button>
              
              {currentPollId && (
                <div className="mt-4">
                  <UnderstandingResults 
                    responses={pollResponses} 
                    totalStudents={participants.length}
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-6">
            <ClassCodeDisplay classCode={displaySession.class_code} />
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Participants ({participants.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {participants.length === 0 ? (
                  <p className="text-gray-500 text-sm">No students have joined yet</p>
                ) : (
                  <ul className="space-y-2">
                    {participants.map((participant) => (
                      <li key={participant.id} className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium mr-3">
                          {participant.user_id.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm">Student joined at {new Date(participant.joined_at).toLocaleTimeString('en-AU')}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}