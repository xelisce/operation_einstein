'use client';

import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh(); // Forces a refresh to clear any cached server data
  };

  return (
    <button 
      onClick={handleLogout}
      className="flex flex-col items-center gap-1 cursor-pointer w-full py-2 border-l-4 border-transparent text-gray-400 hover:text-red-400 hover:border-red-400 transition-colors mt-auto mb-6"
      title="Log Out"
    >
      <LogOut size={24} />
      <span className="text-[10px] font-medium tracking-wide">Logout</span>
    </button>
  );
}