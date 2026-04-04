"use client";
import React from "react";
import Link from "next/link";
import type { Workshop, Assignment } from "../models/types";
import { useEffect, useState } from "react";
import { useAuth } from "../useAuth";
import { authFetch, clearToken } from "../lib/auth";
import { useRouter } from "next/navigation";
import { FileText, Megaphone, BookOpen } from "lucide-react";
export const dynamic = "force-dynamic";

export default function StudentDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [todoList, setTodoList] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    async function load() {
      const base = process.env.NEXT_PUBLIC_API_BASE_URL;
      const res = await authFetch(`${base}/api/dashboard`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setWorkshops(data.workshops);
      setTodoList(data.todoList);
      setLoading(false);
    }
    load();
  }, [user]);

  const handleLogout = () => {
    clearToken();
    router.push("/");
    router.refresh();
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-indigo-600 font-medium animate-pulse">Loading Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.jpg" alt="Operation Einstein" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-none">Operation Einstein</h1>
              <p className="text-xs text-gray-500">Student Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="text-sm bg-red-50 text-red-600 font-medium px-3 py-1.5 rounded-md hover:bg-red-100 transition"
            >
              Log Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex gap-8 items-start">
          {/* Workshop Grid */}
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">My Workshops</h2>
            {workshops.length === 0 ? (
              <div className="text-center py-12 text-gray-400 bg-white rounded-lg border-2 border-dashed">
                No workshops enrolled yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workshops.map((workshop) => (
                  <Link key={workshop.workshopId} href={`/workshops/${workshop.workshopId}`}>
                    <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100 cursor-pointer h-full group">
                      <div className="p-2 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors mb-4 w-fit">
                        <BookOpen className="w-6 h-6 text-indigo-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">
                        {workshop.title}
                      </h3>
                      <p className="text-sm text-gray-500">{workshop.code} • {workshop.term}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* To Do Sidebar */}
          <aside className="w-72 shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">To Do</h3>
              {todoList.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Nothing due.</p>
              ) : (
                <div className="space-y-4">
                  {todoList.map((item) => (
                    <div key={item.assignmentId} className="flex gap-3">
                      <div className="mt-0.5 text-indigo-400 shrink-0">
                        {item.type === "announcement" ? <Megaphone size={16} /> : <FileText size={16} />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-700 leading-tight">{item.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{item.workshop}</p>
                        {item.points > 0 && (
                          <p className="text-xs text-gray-400 mt-0.5">{item.points} pts • {item.dueDate}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
