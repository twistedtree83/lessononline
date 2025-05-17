import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { User } from './lib/supabase';

import Landing from './pages/Landing';
import TeacherDashboard from './pages/TeacherDashboard';
import CreateLesson from './pages/CreateLesson';
import TeacherSession from './pages/TeacherSession';
import StudentDashboard from './pages/StudentDashboard';
import StudentSession from './pages/StudentSession';

function App() {
  // Mock user data instead of authentication
  const [user, setUser] = useState<User | null>(null);

  // Function to set user role (teacher or student)
  const selectRole = (role: 'teacher' | 'student') => {
    setUser({
      id: role === 'teacher' ? 'teacher-123' : 'student-456',
      email: `${role}@example.com`,
      role: role,
      name: role === 'teacher' ? 'Teacher' : 'Student'
    });
  };

  return (
    <Routes>
      {/* Landing page with role selection */}
      <Route path="/" element={<Landing onSelectRole={selectRole} />} />

      {/* Teacher routes */}
      <Route path="/teacher" element={<TeacherDashboard user={user || defaultTeacher} />} />
      <Route path="/teacher/lesson/create" element={<CreateLesson user={user || defaultTeacher} />} />
      <Route path="/teacher/session/:sessionId" element={<TeacherSession user={user || defaultTeacher} />} />

      {/* Student routes */}
      <Route path="/student" element={<StudentDashboard user={user || defaultStudent} />} />
      <Route path="/student/session/:sessionId" element={<StudentSession user={user || defaultStudent} />} />
    </Routes>
  );
}

// Default user objects to avoid null checks
const defaultTeacher: User = {
  id: 'teacher-123',
  email: 'teacher@example.com',
  role: 'teacher',
  name: 'Teacher'
};

const defaultStudent: User = {
  id: 'student-456',
  email: 'student@example.com',
  role: 'student',
  name: 'Student'
};

export default App;