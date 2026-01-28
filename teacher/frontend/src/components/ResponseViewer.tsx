'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type ResponseType = {
  response_id: string;
  student_id: string;
  answer_text: string;
  question_text: string;
  quiz_title: string;
  created_at: string;
};

type Props = {
  quizId?: string; // assignment_id
  refreshTrigger?: number;
};

const ResponseViewer = ({ quizId, refreshTrigger }: Props) => {
  const [responses, setResponses] = useState<ResponseType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchResponses = async () => {
    // Correct Query: Fetch responses, join questions, and then nested join assignments from questions
    // Syntax: *, questions ( question_text, assignments ( title ) )
    
    let query = supabase
      .from('responses')
      .select(`
        *,
        questions (
          question_text,
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
      const formatted = (data || []).map((r: any) => ({
        response_id: r.response_id,
        student_id: r.student_id,
        answer_text: r.answer_text,
        question_text: r.questions?.question_text || 'Unknown',
        quiz_title: r.questions?.assignments?.title || 'Unknown',
        created_at: r.created_at
      }));
      setResponses(formatted);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchResponses();
  }, [quizId, refreshTrigger]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border">
      <div className="flex justify-between items-center mb-6 border-b pb-2">
        <h2 className="text-xl font-semibold text-gray-800">Student Responses ({responses.length})</h2>
        <button 
          onClick={fetchResponses} 
          className="text-sm text-indigo-600 hover:text-indigo-800"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading responses...</p>
      ) : responses.length === 0 ? (
        <p className="text-gray-500 italic">No student responses recorded yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">Student ID</th>
                {!quizId && <th className="px-6 py-3">Quiz</th>}
                <th className="px-6 py-3">Question</th>
                <th className="px-6 py-3">Answer</th>
                <th className="px-6 py-3">Time</th>
              </tr>
            </thead>
            <tbody>
              {responses.map((res) => (
                <tr key={res.response_id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{res.student_id}</td>
                  {!quizId && <td className="px-6 py-4">{res.quiz_title}</td>}
                  <td className="px-6 py-4">{res.question_text}</td>
                  <td className="px-6 py-4 text-gray-900">{res.answer_text}</td>
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
