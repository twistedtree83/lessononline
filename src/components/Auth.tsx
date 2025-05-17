import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import toast from 'react-hot-toast';
import { AlertCircle } from 'lucide-react';

type AuthProps = {
  role: 'teacher' | 'student';
};

export function Auth({ role }: AuthProps) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [hasSupabase, setHasSupabase] = useState(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if Supabase is available
    if (!hasSupabase) {
      toast.error('Authentication is not available in demo mode');
      return;
    }
    
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
          data: { role }
        }
      });
      
      if (error) throw error;
      
      toast.success('Check your email for the login link!');
    } catch (error) {
      toast.error(error.message || 'An error occurred during login');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{role === 'teacher' ? 'Teacher Login' : 'Student Login'}</CardTitle>
        <CardDescription>
          Enter your email below to receive a login link
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hasSupabase && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start">
            <AlertCircle className="h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-700">
              <p className="font-medium mb-1">Demo Mode Active</p>
              <p>Supabase credentials not detected. The app is running in demo mode with mock data.</p>
            </div>
          </div>
        )}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || !hasSupabase}
          >
            {loading ? 'Sending...' : 'Send Login Link'}
          </Button>
        </form>
      </CardContent>
      <CardFooter>
        <p className="text-sm text-center w-full text-gray-500">
          {role === 'teacher' 
            ? 'Log in as a teacher to create and manage lessons' 
            : 'Log in as a student to join classes'}
        </p>
      </CardFooter>
    </Card>
  );
}