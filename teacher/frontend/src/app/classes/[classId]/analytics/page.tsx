'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import AnswerRateCard from '@/components/AnswerRateCard';

// assignment objects come from Supabase
export type Quiz = {
  assignment_id: string;
  title: string;
  created_at: string;
};

export default function AnalyticsPage() {
  const params = useParams();
  const classId = params.classId as string;

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const { data, error } = await supabase
          .from('assignments')
          .select('*')
          .eq('workshop_id', classId)
          .eq('assignment_type', 'assignment')
          .order('title');
        if (error) throw error;
        setQuizzes(data || []);
      } catch (err) {
        console.error('Error fetching quizzes:', err);
      } finally {
        setLoading(false);
      }
    };

    if (classId) {
      fetchQuizzes();
    }
  }, [classId]);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-2 text-sm">
              <Link
                href={`/classes/${classId}`}
                className="text-indigo-600 hover:text-indigo-800"
              >
                &larr; Back to Class
              </Link>
              <span className="text-gray-300">/</span>
              <span className="text-gray-500">Class Analytics</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mt-4">
              Class Analytics
            </h1>
            <p className="text-gray-600 mt-2">
              Track learning engagement and completion rates
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">
            Quiz analytics
          </h2>

          {loading ? (
            <p className="text-gray-500">Loading quizzes...</p>
          ) : quizzes.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow text-center">
              <p className="text-gray-500 text-lg">
                No quizzes found for this class.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {quizzes.map((quiz) => (
                <AnswerRateCard
                  key={quiz.assignment_id}
                  quizId={quiz.assignment_id}
                  quizTitle={quiz.title}
                  classId={classId}
                  refreshTrigger={refreshTrigger}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

