import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import toast from 'react-hot-toast';
import { mockDatabase } from '../lib/supabase';

type JoinClassFormProps = {
  userId: string;
  onJoin: (sessionId: string) => void;
};

export default function JoinClassForm({ userId, onJoin }: JoinClassFormProps) {
  const [classCode, setClassCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!classCode.trim()) {
      toast.error('Please enter a class code');
      return;
    }
    
    setLoading(true);
    
    try {
      // Find the session with the given class code in our mock database
      const session = mockDatabase.sessions.find(s => 
        s.class_code.toUpperCase() === classCode.toUpperCase() && s.active
      );
      
      if (!session) {
        // If no matching session, create a mock one for demo purposes
        const mockLesson = mockDatabase.lessons[0];
        const newSession = {
          id: `session-${Date.now()}`,
          lesson_id: mockLesson.id,
          class_code: classCode.toUpperCase(),
          active: true,
          created_at: new Date().toISOString()
        };
        
        mockDatabase.sessions.push(newSession);
        
        // Add the student as a participant
        mockDatabase.participants.push({
          id: `participant-${Date.now()}`,
          session_id: newSession.id,
          user_id: userId,
          joined_at: new Date().toISOString()
        });
        
        toast.success('Successfully joined the class!');
        onJoin(newSession.id);
        return;
      }
      
      // Add the student as a participant
      mockDatabase.participants.push({
        id: `participant-${Date.now()}`,
        session_id: session.id,
        user_id: userId,
        joined_at: new Date().toISOString()
      });
      
      toast.success('Successfully joined the class!');
      onJoin(session.id);
      
    } catch (error) {
      toast.error('Could not join the class. Please try again.');
      console.error('Error joining class:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Join a Class</CardTitle>
        <CardDescription>
          Enter the class code provided by your teacher
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleJoin} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Enter class code"
              value={classCode}
              onChange={(e) => setClassCode(e.target.value.toUpperCase())}
              className="text-center text-2xl tracking-widest uppercase"
              maxLength={6}
              required
            />
          </div>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading}
          >
            {loading ? 'Joining...' : 'Join Class'}
          </Button>
        </form>
      </CardContent>
      <CardFooter>
        <p className="text-sm text-center w-full text-gray-500">
          Make sure to enter the code exactly as shown
        </p>
      </CardFooter>
    </Card>
  );
}

export { JoinClassForm }