'use client';

import ClassManager from "@/components/ClassManager";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function Home() {
  const handleLogout = async () => {
    // 1. Sign out of Supabase to clear the session
    await supabase.auth.signOut();
    
    // 2. Redirect back to the main auth gateway (Student App)
    const STUDENT_APP_URL = process.env.NEXT_PUBLIC_STUDENT_URL || '';
    window.location.href = `${STUDENT_APP_URL}/?action=logout`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📘</span>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-none">Operation Einstein</h1>
              <p className="text-xs text-gray-500">Teacher Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <span className="text-sm text-gray-600">Welcome, Teacher</span>
             <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold">T</div>

             <button 
                onClick={handleLogout} 
                className="text-sm bg-red-50 text-red-600 font-medium px-3 py-1.5 rounded-md hover:bg-red-100 transition ml-2"
              >
                Log Out
              </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <ClassManager />
      </main>
    </div>
  );
}