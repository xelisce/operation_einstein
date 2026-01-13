'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

type ClassType = {
  _id: string;
  name: string;
  grade: number;
  students: { name: string; studentId: string }[];
};

type QuizType = {
  _id: string;
  title: string;
  createdAt: string;
};

export default function ClassDetail() {
  const params = useParams();
  const classId = params.classId as string;
  
  const [classData, setClassData] = useState<ClassType | null>(null);
  const [quizzes, setQuizzes] = useState<QuizType[]>([]);
  const [newQuizTitle, setNewQuizTitle] = useState('');
  const [activeTab, setActiveTab] = useState<'quizzes' | 'students'>('quizzes');
  const [loading, setLoading] = useState(true);

  const fetchClass = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:5001/api/classes/${classId}`);
      if (!res.ok) throw new Error('Class not found');
      const data = await res.json();
      setClassData(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizzes = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:5001/api/quizzes?classId=${classId}`);
      const data = await res.json();
      setQuizzes(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (classId) {
      fetchClass();
      fetchQuizzes();
    }
  }, [classId]);

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuizTitle.trim()) return;
    try {
      const res = await fetch('http://127.0.0.1:5001/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newQuizTitle, classId })
      });
      if (res.ok) {
        setNewQuizTitle('');
        fetchQuizzes();
      }
    } catch (error) {
      alert('Failed to create quiz');
    }
  };


  const handleSimulateStudents = async () => {
    if (!confirm('Generate 20 mock students?')) return;
    try {
      await fetch(`http://127.0.0.1:5001/api/classes/${classId}/simulate-students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 20 })
      });
      fetchClass();
    } catch (e) {
      alert('Failed to simulate');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading class details...</div>;
  if (!classData) return <div className="p-8 text-center text-red-500">Class not found.</div>;


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link href="/" className="text-sm text-indigo-600 hover:text-indigo-800 mb-2 inline-block">
            &larr; Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{classData.name}</h1>
          <p className="text-gray-500">Grade {classData.grade}</p>

          {/* Tabs */}
          <div className="flex gap-6 mt-6 border-b border-gray-100">
            <button
              onClick={() => setActiveTab('quizzes')}
              className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'quizzes' 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Quizzes & Assessments
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'students' 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Students
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'quizzes' && (
          <div className="bg-white p-6 rounded-lg shadow-sm border space-y-6">
            <div className="flex justify-between items-end border-b pb-6">
              <h2 className="text-xl font-semibold text-gray-800">Assigned Quizzes</h2>
              <form onSubmit={handleCreateQuiz} className="flex gap-2">
                <input
                  type="text"
                  value={newQuizTitle}
                  onChange={(e) => setNewQuizTitle(e.target.value)}
                  placeholder="New Quiz Title"
                  className="border rounded px-3 py-1 text-sm w-64"
                  required
                />
                <button type="submit" className="bg-indigo-600 text-white px-4 py-1 rounded hover:bg-indigo-700 text-sm">
                  Create
                </button>
              </form>
            </div>

            {quizzes.length === 0 ? (
              <div className="text-center py-12 text-gray-400 bg-gray-50 rounded border-2 border-dashed">
                No quizzes created yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {quizzes.map((quiz) => (
                  <Link 
                    key={quiz._id} 
                    href={`/classes/${classId}/quizzes/${quiz._id}`}
                    className="block border p-4 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition"
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-lg text-gray-900">{quiz.title}</h3>
                      <span className="text-sm text-gray-500">
                        Created: {new Date(quiz.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'students' && (
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Class Roster ({classData.students?.length || 0})</h2>
              <button 
                onClick={handleSimulateStudents}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm"
              >
                + Generate 20 Mock Students
              </button>
            </div>
            
            {(!classData.students || classData.students.length === 0) ? (
              <div className="text-center py-12 text-gray-400 bg-gray-50 rounded border-2 border-dashed">
                No students enrolled.
              </div>
            ) : (
              <div className="overflow-hidden border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {classData.students.map((s, idx) => (
                      <tr key={idx}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{s.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.studentId}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
