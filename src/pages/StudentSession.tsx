import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { StudentUnderstandingCheck } from '../components/UnderstandingCheck';
import { mockDatabase, User, Lesson, Session, UnderstandingCheck } from '../lib/supabase';
import { socketClient } from '../lib/socket';
import { ArrowLeft, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

type StudentSessionProps = {
  user: User;
};

export default function StudentSession({ user }: StudentSessionProps) {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCheck, setActiveCheck] = useState<UnderstandingCheck | null>(null);
  const [hasResponded, setHasResponded] = useState<boolean>(false);
  const [realTimeAvailable, setRealTimeAvailable] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionId) {
      fetchSessionData(sessionId);
      
      // Connect to the socket server for real-time updates
      try {
        socketClient.joinSession(sessionId, user.id, 'student');
        setRealTimeAvailable(true);
        
        // Set up listener for understanding checks
        const checkHandler = (check: UnderstandingCheck) => {
          setActiveCheck(check);
          setHasResponded(false);
          toast.success('New understanding check from your teacher');
        };
        
        socketClient.on('understanding:check', checkHandler);
        
        return () => {
          socketClient.off('understanding:check', checkHandler);
        };
      } catch (error) {
        console.error('Failed to initialize real-time connection:', error);
        setRealTimeAvailable(false);
      }
    }
  }, [sessionId, user.id]);

  // Fallback polling method if socket connection isn't available
  useEffect(() => {
    if (!realTimeAvailable && sessionId) {
      const checkForNewUnderstandingPolls = setInterval(() => {
        checkForNewUnderstandingChecks(sessionId);
      }, 5000);
      
      return () => clearInterval(checkForNewUnderstandingPolls);
    }
  }, [sessionId, activeCheck, realTimeAvailable]);

  const checkForNewUnderstandingChecks = async (sid: string) => {
    try {
      const { data: latestCheck } = mockDatabase.getLatestUnderstandingCheck(sid);
      
      // If there's a new check and we haven't already shown it, display it
      if (latestCheck && (!activeCheck || latestCheck.id !== activeCheck.id)) {
        setActiveCheck(latestCheck);
        setHasResponded(false);
        
        // Check if the user has already responded
        const { data: responses } = mockDatabase.getUnderstandingResponses(latestCheck.id);
        const userParticipant = mockDatabase.participants.find(
          p => p.session_id === sid && p.user_id === user.id
        );
        
        if (userParticipant) {
          const hasUserResponded = responses.some(r => r.participant_id === userParticipant.id);
          setHasResponded(hasUserResponded);
        }
      }
    } catch (error) {
      console.error('Error checking for understanding checks:', error);
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
        
        // For student view, we'll hide the teacher-specific insights
        const studentViewLesson = {
          ...mockLesson,
          content: {
            introduction: mockLesson.content.introduction,
            body: mockLesson.content.body,
            conclusion: mockLesson.content.conclusion,
            // Pain points and vocabulary notes are intentionally not included in student view
          }
        };
        
        setLesson(studentViewLesson);
        
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
        
        if (mockLesson) {
          // Create a student view version (without teacher insights)
          const studentViewLesson = {
            ...mockLesson,
            content: {
              introduction: mockLesson.content.introduction,
              body: mockLesson.content.body,
              conclusion: mockLesson.content.conclusion,
              // Pain points and vocabulary notes are intentionally not included in student view
            }
          };
          
          setLesson(studentViewLesson);
        } else {
          setLesson(mockDatabase.lessons[0]);
        }
        
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
      
      // Check for any active understanding checks
      checkForNewUnderstandingChecks(sid);
    } catch (error) {
      toast.error('Failed to load session data');
      console.error('Error fetching session data:', error);
      navigate('/student');
    } finally {
      setLoading(false);
    }
  };

  const handleUnderstandingResponse = async (checkId: string, response: 'understood' | 'not-understood' | null) => {
    if (!response || !sessionId) return;
    
    try {
      // Find the user's participant record
      const userParticipant = mockDatabase.participants.find(
        p => p.session_id === sessionId && p.user_id === user.id
      );
      
      if (!userParticipant) {
        toast.error('You are not registered as a participant in this session');
        return;
      }
      
      // If real-time is available, use socket.io
      if (realTimeAvailable) {
        socketClient.sendUnderstandingResponse(checkId, response);
      } else {
        // Otherwise use mock database
        mockDatabase.respondToUnderstandingCheck(checkId, userParticipant.id, response);
      }
      
      setHasResponded(true);
      toast.success('Response submitted');
    } catch (error) {
      toast.error('Failed to submit response');
      console.error('Error submitting understanding response:', error);
    }
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
        <div className="flex items-center mb-6">
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
        
        {!realTimeAvailable && (
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-md text-amber-800 text-sm mb-4">
            <p className="font-medium">Real-time functionality limited</p>
            <p>Using fallback mode for understanding checks.</p>
          </div>
        )}
        
        {activeCheck && (
          <StudentUnderstandingCheck
            checkId={activeCheck.id}
            question={activeCheck.question}
            onRespond={handleUnderstandingResponse}
            disabled={hasResponded || !displaySession.active}
          />
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2" />
              Lesson Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{displayLesson.content.introduction.replace(/<\/?[^>]+(>|$)/g, "")}</p>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Main Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <div dangerouslySetInnerHTML={{ __html: displayLesson.content.body }} />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Conclusion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <div dangerouslySetInnerHTML={{ __html: displayLesson.content.conclusion }} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}