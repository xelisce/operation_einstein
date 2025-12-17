'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type ClassType = {
  _id: string;
  name: string;
  grade: number;
};

const ClassManager = () => {
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchClasses = async () => {
    try {
      const res = await fetch('http://127.0.0.1:5001/api/classes');
      const data = await res.json();
      setClasses(data);
    } catch (error) {
      console.error('Failed to fetch classes', error);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:5001/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, grade: Number(grade) }),
      });
      if (res.ok) {
        setName('');
        setGrade('');
        fetchClasses();
      }
    } catch (error) {
      alert('Error creating class');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Create New Class Section */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Create New Class</h2>
        <form onSubmit={handleCreate} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">Class Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 border p-2 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              required
              placeholder="e.g. Science Grade 5"
            />
          </div>
          <div className="w-32">
            <label className="block text-sm font-medium text-gray-700">Grade Level</label>
            <input
              type="number"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 border p-2 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="5"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:bg-gray-400 font-medium transition-colors"
          >
            {loading ? 'Adding...' : 'Add Class'}
          </button>
        </form>
      </div>

      {/* Class Grid */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Classes</h2>
        {classes.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <p className="text-gray-500">No classes found. Create one to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((cls) => (
              <Link key={cls._id} href={`/classes/${cls._id}`}>
                <div className="block bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100 cursor-pointer h-full group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
                      {/* Simple Icon */}
                      <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      Grade {cls.grade}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">
                    {cls.name}
                  </h3>
                  <p className="text-sm text-gray-500">Manage students & quizzes</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassManager;
