'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import QuestionForm from '@/components/QuestionForm';
import QuestionList from '@/components/QuestionList';
import ResponseViewer from '@/components/ResponseViewer';

export default function QuizDetail() {
  const params = useParams();
  const classId = params.classId as string;
  const quizId = params.quizId as string;
  
  const [quizData, setQuizData] = useState<any>(null); // Quick type
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchQuiz = async () => {
      const res = await fetch(`http://127.0.0.1:5001/api/quizzes?classId=${classId}`);
      const data = await res.json();
      const quiz = data.find((q: any) => q._id === quizId);
      setQuizData(quiz);
  };

  useEffect(() => {
    if (quizId) fetchQuiz();
  }, [quizId, classId]);

  const handleSimulate = async () => {
    if (!confirm('Simulate 20 students taking this quiz? This will clear existing responses.')) return;
    try {
      const res = await fetch(`http://127.0.0.1:5001/api/quizzes/${quizId}/simulate`, { method: 'POST' });
      const data = await res.json();
      alert(`Simulation complete! Generated ${data.count} responses.`);
      setRefreshKey(k => k + 1); // Refresh lists
    } catch (e) {
      alert('Simulation failed');
    }
  };

  if (!quizData) return <div className="p-8 text-center text-gray-500">Loading quiz...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-2 text-sm">
              <Link href={`/classes/${classId}`} className="text-indigo-600 hover:text-indigo-800">
                &larr; Back to Class
              </Link>
              <span className="text-gray-300">/</span>
              <span className="text-gray-500">Quiz Detail</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{quizData.title}</h1>
          </div>
          <button 
            onClick={handleSimulate}
            className="bg-purple-600 text-white px-4 py-2 rounded shadow hover:bg-purple-700 transition"
          >
            ⚡ Simulate Responses
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Question Builder */}
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Add Question</h2>
            <QuestionForm 
              quizId={quizId} 
              onQuestionCreated={() => setRefreshKey(k => k + 1)} 
            />
          </div>
        </div>

        {/* Right: Existing Questions */}
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border h-full">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Quiz Questions</h2>
            <QuestionList quizId={quizId} refreshTrigger={refreshKey} />
          </div>
        </div>
        
        {/* Bottom: Responses */}
        <div className="col-span-1 lg:col-span-2">
           <ResponseViewer quizId={quizId} refreshTrigger={refreshKey} />
        </div>
      </main>
    </div>
  );
}
