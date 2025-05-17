import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { mockDatabase, User, Lesson } from '../lib/supabase';
import { Plus, BookOpen, Play, LogOut, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

type TeacherDashboardProps = {
  user: User;
};

export default function TeacherDashboard({ user }: TeacherDashboardProps) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApiWarning, setShowApiWarning] = useState(!import.meta.env.VITE_OPENAI_API_KEY);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLessons();
  }, []);

  const fetchLessons = async () => {
    try {
      // Use mock database instead of Supabase
      const { data, error } = await mockDatabase.getLessons(user.id);

      if (error) throw error;
      setLessons(data || []);
    } catch (error) {
      toast.error('Failed to load lessons');
      console.error('Error fetching lessons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    navigate('/');
  };

  const startSession = async (lessonId: string) => {
    try {
      // Generate a random class code
      const classCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const { data, error } = await mockDatabase.createSession({ 
        lesson_id: lessonId, 
        class_code: classCode, 
        active: true 
      });

      if (error) throw error;

      toast.success('Session started successfully!');
      navigate(`/teacher/session/${data.id}`);
    } catch (error) {
      toast.error('Failed to start session');
      console.error('Error starting session:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user.name || user.email}</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
        
        {showApiWarning && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-md flex items-start">
            <AlertTriangle className="h-5 w-5 text-amber-500 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-amber-800">OpenAI API Key Not Found</h3>
              <p className="text-amber-700 mt-1">
                The document analysis feature will use basic text processing instead of AI analysis.
                To enable AI analysis, add your OpenAI API key to the environment variables.
              </p>
            </div>
          </div>
        )}

        <div className="mb-6">
          <Link to="/teacher/lesson/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create New Lesson
            </Button>
          </Link>
        </div>

        <h2 className="text-xl font-semibold mb-4">Your Lessons</h2>
        
        {loading ? (
          <p>Loading lessons...</p>
        ) : lessons.length === 0 ? (
          <Card>
            <CardContent className="py-10">
              <div className="text-center">
                <BookOpen className="h-12 w-12 mx-auto text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">No lessons yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating your first lesson plan
                </p>
                <Link to="/teacher/lesson/create" className="mt-4 inline-block">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Lesson
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lessons.map((lesson) => (
              <Card key={lesson.id}>
                <CardHeader>
                  <CardTitle>{lesson.title}</CardTitle>
                  <CardDescription>
                    Created on {new Date(lesson.created_at).toLocaleDateString('en-AU')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-3 text-sm text-gray-500">
                    {lesson.content.introduction.substring(0, 150)}...
                  </p>
                </CardContent>
                <CardFooter className="flex justify-end space-x-2">
                  <Button 
                    variant="secondary"
                    onClick={() => navigate(`/teacher/lesson/${lesson.id}`)}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  <Button onClick={() => startSession(lesson.id)}>
                    <Play className="h-4 w-4 mr-2" />
                    Start Session
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}