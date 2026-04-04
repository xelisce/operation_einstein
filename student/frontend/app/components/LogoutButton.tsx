'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { clearToken } from '../lib/auth';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    clearToken();
    router.push('/');
    router.refresh();
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
