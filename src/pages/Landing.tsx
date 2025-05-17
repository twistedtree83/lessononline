import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { School, GraduationCap } from 'lucide-react';

type LandingProps = {
  onSelectRole: (role: 'teacher' | 'student') => void;
};

export default function Landing({ onSelectRole }: LandingProps) {
  const navigate = useNavigate();

  const handleTeacherClick = () => {
    onSelectRole('teacher');
    navigate('/teacher');
  };

  const handleStudentClick = () => {
    onSelectRole('student');
    navigate('/student');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900">Classroom App</h1>
          <p className="mt-2 text-sm text-gray-600">
            Connect teachers and students in interactive classroom sessions
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleTeacherClick}>
            <CardHeader>
              <CardTitle className="flex items-center justify-center">
                <School className="h-5 w-5 mr-2" />
                Teacher Mode
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Create lessons and manage classroom sessions
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleStudentClick}>
            <CardHeader>
              <CardTitle className="flex items-center justify-center">
                <GraduationCap className="h-5 w-5 mr-2" />
                Student Mode
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Join classroom sessions and view lesson content
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}