// Student Dashboard Page

import React from "react";
import { 
  BookOpen, 
  Calendar, 
  LayoutDashboard, 
  MessageSquare, 
  Bell, 
  MoreVertical, 
  FileText, 
  Megaphone,
  CheckCircle2,
  X
} from "lucide-react";

import Link from "next/link";
import type { Workshop, Assignment } from "../models/types";
import LogoutButton from "../components/LogoutButton";
export const dynamic = "force-dynamic";

async function getDashboardData(): Promise<{
  workshops: Workshop[];
  todoList: Assignment[];
}> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  const res = await fetch(`${base}/api/dashboard`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load dashboard data");
  return (await res.json()) as { workshops: Workshop[]; todoList: Assignment[] };
}

export default async function StudentDashboard() {
  const { workshops, todoList } = await getDashboardData();

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900 font-sans">
      
      {/* --- LEFT NAVIGATION SIDEBAR --- */}
      <aside className="w-[84px] bg-[#2D3B45] flex flex-col items-center py-4 fixed h-full z-10 text-white shrink-0">
        <div className="mb-6">
            {/* Logo Placeholder */}
            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                <span className="font-bold text-lg">V</span>
            </div>
        </div>
        
        <nav className="flex flex-col gap-6 w-full flex-1">
          <NavItem icon={<LayoutDashboard size={24} />} label="Dashboard" active />
          <NavItem icon={<BookOpen size={24} />} label="Courses" />
          <NavItem icon={<Calendar size={24} />} label="Calendar" />
          <NavItem icon={<MessageSquare size={24} />} label="Inbox" />
        </nav>

        <LogoutButton />
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 ml-[84px] flex flex-col md:flex-row">
        
        {/* CENTER DASHBOARD */}
        <main className="flex-1 p-8">
          <header className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-normal text-gray-800">Dashboard</h1>
            <button className="p-2 hover:bg-gray-200 rounded-full">
               <MoreVertical className="text-gray-500" />
            </button>
          </header>

          {/* Course Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
            {workshops.map((course) => (
              <div 
                key={course.workshopId} 
                className="group flex flex-col bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-64"
              >
                {/* Colored Header */}
                <div className={`${course.color} h-36 relative p-4`}>
                    <button className="absolute top-2 right-2 text-white/80 hover:text-white">
                        <MoreVertical size={20} />
                    </button>
                </div>

                {/* Card Content */}
                <div className="p-4 flex flex-col justify-between flex-1">
                  <div>
                    <h2 className="text-emerald-700 font-bold text-lg leading-tight">
                      <Link href={`/workshops/${course.workshopId}`} className="hover:underline">
                        {course.title}
                      </Link>
                    </h2> 
                    <p className="text-gray-500 text-sm mt-1">
                        {course.code} • {course.term}
                    </p>
                  </div>

                  {/* Action Icons (Assignments, Announcements, etc.) */}
                  <div className="flex gap-4 mt-4 text-gray-400">
                    <Megaphone size={18} className="hover:text-emerald-600 transition-colors" />
                    <FileText size={18} className="hover:text-emerald-600 transition-colors" /> 
                    <MessageSquare size={18} className="hover:text-emerald-600 transition-colors" />
                    <div className="flex-1" /> {/* Spacer */}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* --- RIGHT SIDEBAR (TO DO LIST / ASSIGNMENTS) --- */}
        <aside className="w-full md:w-80 bg-white border-l border-gray-200 p-6 shrink-0 hidden md:block">
          <div className="mb-6">
            <h3 className="text-gray-500 font-bold uppercase text-xs tracking-wider mb-4">To Do</h3>
            <div className="flex flex-col gap-4">
              {todoList.map((item) => (
                <div key={item.assignmentId} className="flex gap-3 group cursor-pointer">
                  <div className="mt-1 text-gray-400 group-hover:text-emerald-600">
                    <AssignmentIcon type={item.type} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <h4 className="text-sm font-bold text-gray-700 group-hover:underline leading-tight">
                            {item.title}
                        </h4>
                        <button className="text-gray-300 hover:text-gray-500">
                            <X size={14} />
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        {item.workshop}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                        {item.points > 0 ? `${item.points} points • ` : ''} {item.dueDate}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <button className="text-sm text-emerald-700 font-medium mt-6 hover:underline">
                Show All
            </button>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-gray-500 font-bold uppercase text-xs tracking-wider mb-4 flex justify-between">
                Recent Feedback
            </h3>
             <div className="flex gap-3 text-sm text-gray-500 items-center">
                 <CheckCircle2 size={16} className="text-green-600" />
                 <span>Nothing for now</span>
             </div>
          </div>
        </aside>

      </div>
    </div>
  );
}

// --- Helper Components ---

function NavItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-1 cursor-pointer w-full py-2 border-l-4 transition-colors ${active ? 'border-white text-white' : 'border-transparent text-gray-400 hover:text-white'}`}>
      {icon}
      <span className="text-[10px] font-medium tracking-wide">{label}</span>
    </div>
  );
}

function AssignmentIcon({ type }: { type: string }) {
    if (type === 'announcement') return <Megaphone size={18} />;
    return <FileText size={18} />;
}