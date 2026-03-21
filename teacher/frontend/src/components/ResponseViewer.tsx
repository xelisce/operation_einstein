'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type ResponseType = {
  response_id: string;
  student_id: string;
  answer_text: string;
  question_text: string;
  question_id: string;
  correct_answer: string | null;
  question_type: string;
  quiz_title: string;
  created_at: string;
  is_correct?: boolean;
};

type Props = {
  quizId?: string; // assignment_id
  refreshTrigger?: number;
};

const ResponseViewer = ({ quizId, refreshTrigger }: Props) => {
  const [responses, setResponses] = useState<ResponseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'correct' | 'wrong'>('all');
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [sortBy, setSortBy] = useState<'student' | 'question'>('student');

  const fetchResponses = async () => {
    // Correct Query: Fetch responses, join questions, and then nested join assignments from questions
    // Syntax: *, questions ( question_text, assignments ( title ) )
    
    let query = supabase
      .from('responses')
      .select(`
        *,
        questions (
          question_id,
          question_text,
          type,
          correct_answer,
          assignments (
            title
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (quizId) {
      const { data: qData } = await supabase.from('questions').select('question_id').eq('assignment_id', quizId);
      if (qData && qData.length > 0) {
        const qIds = qData.map(q => q.question_id);
        query = query.in('question_id', qIds);
      } else {
        setResponses([]);
        setLoading(false);
        return;
      }
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching responses:', error);
    } else {
      // Map the nested data to a flat structure for the table
      const normalize = (s: any) => (s || '').toString().trim().toLowerCase();
      const formatted = (data || []).map((r: any) => {
        let is_correct = false;
        if (r.questions?.correct_answer) {
          if (r.questions.type === 'scale') {
            is_correct = Number(r.answer_text) === Number(r.questions.correct_answer);
          } else {
            is_correct = normalize(r.answer_text) === normalize(r.questions.correct_answer);
          }
        }
        return {
          response_id: r.response_id,
          student_id: r.student_id,
          answer_text: r.answer_text,
          question_id: r.questions?.question_id || '',
          question_text: r.questions?.question_text || 'Unknown',
          correct_answer: r.questions?.correct_answer || null,
          question_type: r.questions?.type || 'text',
          quiz_title: r.questions?.assignments?.title || 'Unknown',
          created_at: r.created_at,
          is_correct
        };
      });
      setResponses(formatted);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchResponses();
  }, [quizId, refreshTrigger]);

  // Determine which responses to display based on filter
  const getFilteredResponses = () => {
    let filtered = responses;

    // Apply type filter first
    if (filterType === 'correct') {
      filtered = filtered.filter(r => r.is_correct);
    } else if (filterType === 'wrong') {
      filtered = filtered.filter(r => !r.is_correct && r.correct_answer);
    }

    // If NOT showing duplicates, filter them out
    if (!showDuplicates) {
      const seen = new Map<string, ResponseType>();
      filtered.forEach(r => {
        const key = `${r.student_id}|${r.question_id}`;
        // Keep the first (latest) response for each student-question pair
        if (!seen.has(key)) {
          seen.set(key, r);
        }
      });
      filtered = Array.from(seen.values());
    }

    return filtered;
  };

  // Apply sorting
  const getSortedResponses = (filtered: ResponseType[]) => {
    const sorted = [...filtered];
    if (sortBy === 'student') {
      sorted.sort((a, b) => a.student_id.localeCompare(b.student_id));
    } else if (sortBy === 'question') {
      sorted.sort((a, b) => a.question_text.localeCompare(b.question_text));
    }
    return sorted;
  };

  const filteredResponses = getFilteredResponses();
  const displayedResponses = getSortedResponses(filteredResponses);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border">
      <div className="flex justify-between items-center mb-6 border-b pb-2">
        <h2 className="text-xl font-semibold text-gray-800">Student Responses ({displayedResponses.length})</h2>
        <button 
          onClick={fetchResponses} 
          className="text-sm text-indigo-600 hover:text-indigo-800"
        >
          Refresh
        </button>
      </div>

      {/* Filter and Sort Controls */}
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <div>
          <label className="text-sm font-medium text-gray-700 mr-2">Filter:</label>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value as 'all' | 'correct' | 'wrong')}
            className="border rounded px-3 py-1 text-sm text-gray-900"
          >
            <option value="all">View All</option>
            <option value="correct">Correct Only</option>
            <option value="wrong">Wrong Only</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="duplicates-check"
            checked={showDuplicates}
            onChange={e => setShowDuplicates(e.target.checked)}
            className="rounded border-gray-300"
          />
          <label htmlFor="duplicates-check" className="text-sm font-medium text-gray-700">
            Show Duplicates?
          </label>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mr-2">Sort:</label>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as 'student' | 'question')}
            className="border rounded px-3 py-1 text-sm text-gray-900"
          >
            <option value="student">By Student</option>
            <option value="question">By Question</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading responses...</p>
      ) : displayedResponses.length === 0 ? (
        <p className="text-gray-500 italic">No student responses found for the selected filter.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">Student ID</th>
                {!quizId && <th className="px-6 py-3">Quiz</th>}
                <th className="px-6 py-3">Question</th>
                <th className="px-6 py-3">Answer</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Time</th>
              </tr>
            </thead>
            <tbody>
              {displayedResponses.map((res) => (
                <tr key={res.response_id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{res.student_id}</td>
                  {!quizId && <td className="px-6 py-4">{res.quiz_title}</td>}
                  <td className="px-6 py-4">{res.question_text}</td>
                  <td className="px-6 py-4 text-gray-900">{res.answer_text}</td>
                  <td className="px-6 py-4">
                    {res.correct_answer ? (
                      <span className={res.is_correct ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                        {res.is_correct ? '✓ Correct' : '✗ Wrong'}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">{new Date(res.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ResponseViewer;
