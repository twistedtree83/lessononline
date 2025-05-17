import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { JoinClassForm } from '../components/JoinClassForm';
import { mockDatabase, User, Session as ClassSession } from '../lib/supabase';
import { History, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

type StudentDashboardProps = {
  user: User;
};

export default function StudentDashboard({ user }: StudentDashboardProps) {
  const [pastSessions, setPastSessions] = useState<ClassSession[]>([]);
  const navigate = useNavigate();

  const handleSignOut = () => {
    navigate('/');
  };

  const handleJoinSession = (sessionId: string) => {
    navigate(`/student/session/${sessionId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
            <p className="text-gray-600">Welcome, {user.name || user.email}</p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <JoinClassForm userId={user.id} onJoin={handleJoinSession} />
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <History className="h-5 w-5 mr-2" />
                  Recent Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pastSessions.length === 0 ? (
                  <p className="text-gray-500 text-sm">No past sessions</p>
                ) : (
                  <ul className="space-y-3">
                    {pastSessions.map((session) => (
                      <li key={session.id} className="border-b pb-3 last:border-b-0 last:pb-0">
                        <p className="font-medium">{session.id}</p>
                        <p className="text-sm text-gray-500">
                          Joined on {new Date(session.created_at).toLocaleDateString('en-AU')}
                        </p>
                        <Button 
                          variant="link" 
                          className="p-0 h-auto text-sm"
                          onClick={() => navigate(`/student/session/${session.id}`)}
                        >
                          View session
                        </Button>
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