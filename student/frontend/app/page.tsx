'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function AuthGateway() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  // Auth Form State
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const TEACHER_APP_URL = process.env.NEXT_PUBLIC_TEACHER_URL;

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'logout') {
      supabase.auth.signOut().then(() => {
        window.location.href = '/'; // Reload to wipe the URL clean
      });
      return; // Stop the rest of the effect from running
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) routeUser(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        routeUser(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const routeUser = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data.role === 'teacher') {
        window.location.href = `${TEACHER_APP_URL}/`;
      } else {
        // Route students to their newly created dashboard page
        router.push('/dashboard'); 
      }
    } catch (err) {
      console.error("Error fetching role:", err);
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
      } else {
        const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
        if (authError) throw authError;
        
        if (authData.user) {
          await supabase.from('profiles').insert([{ id: authData.user.id, email, role }]);
        }
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-emerald-600 font-medium animate-pulse">Loading Operation Einstein...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center text-3xl font-bold mb-4">
            V
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Operation Einstein</h1>
          <p className="text-gray-500 text-sm mt-1">Science Workshop Portal</p>
        </div>

        <h2 className="text-lg font-semibold mb-6 text-center text-gray-800">
          {isLogin ? 'Welcome Back!' : 'Create your Account'}
        </h2>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-5">
          {!isLogin && (
            <div className="flex gap-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                <input 
                  type="radio" 
                  checked={role === 'student'} 
                  onChange={() => setRole('student')} 
                  className="text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                Student
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                <input 
                  type="radio" 
                  checked={role === 'teacher'} 
                  onChange={() => setRole('teacher')}
                  className="text-emerald-600 focus:ring-emerald-500 w-4 h-4" 
                />
                Teacher
              </label>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white rounded-lg py-2.5 px-4 hover:bg-emerald-700 transition-colors font-semibold shadow-sm disabled:opacity-70"
          >
            {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-sm text-emerald-600 hover:text-emerald-800 font-medium"
          >
            {isLogin ? "Need an account? Sign up" : "Already have an account? Log in"}
          </button>
        </div>
      </div>
    </div>
  );
}