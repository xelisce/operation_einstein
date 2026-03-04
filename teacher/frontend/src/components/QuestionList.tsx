'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Question = {
  question_id: string;
  question_text: string;
  type: string;
  options: string[]; // We might need to fetch this from 'questionoptions' table if not joined
};

type QuestionWithAverage = Question & {
  average?: number; // average numeric answer value
  responseCount?: number; // number of responses
};

type Props = {
  quizId?: string; // This is assignment_id
  refreshTrigger?: number;
};

const QuestionList = ({ quizId, refreshTrigger }: Props) => {
  const [questions, setQuestions] = useState<QuestionWithAverage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCorrect, setEditCorrect] = useState('');
  const [editPoints, setEditPoints] = useState<number | ''>('');

  const fetchQuestions = async () => {
    if (!quizId) return;
    
    // Fetch questions
    const { data: qData, error: qError } = await supabase
      .from('questions')
      .select('*')
      .eq('assignment_id', quizId)
      .order('question_order');

    if (qError) {
      setError(qError.message);
      setLoading(false);
      return;
    }

    // Since options are in a separate table, we need to fetch them for MC questions
    // Optimization: We could use a join query if we had foreign keys set up perfectly for array return
    // Simple way: Fetch all options for these questions
    if (qData) {
      const questionIds = qData.map(q => q.question_id);
      const { data: oData } = await supabase
        .from('questionoptions')
        .select('*')
        .in('question_id', questionIds)
        .order('option_order');

      // Fetch responses to calculate averages
      const { data: responses } = await supabase
        .from('responses')
        .select('question_id, answer_text')
        .in('question_id', questionIds);

      // Merge options and calculate averages
      const merged = qData.map(q => {
        const opts = oData 
          ? oData.filter(o => o.question_id === q.question_id).map(o => o.option_text) 
          : [];
        
        // Calculate average for numeric types (scale, number, text)
        let average: number | undefined;
        let responseCount = 0;
        if (responses) {
          const qResponses = responses.filter(r => r.question_id === q.question_id);
          responseCount = qResponses.length;
          
          // Try to convert answers to numbers, trimming whitespace
          const numericAnswers = qResponses
            .map(r => {
              const trimmed = r.answer_text?.trim();
              // Type cast: explicitly handle string to number conversion
              const num = trimmed ? parseFloat(trimmed) : NaN;
              return num;
            })
            .filter(n => !isNaN(n) && isFinite(n));
          
          if (numericAnswers.length > 0) {
            const sum = numericAnswers.reduce((acc, val) => acc + val, 0);
            average = sum / numericAnswers.length;
          }

          console.log(`Question ID: ${q.question_id}, Total Responses: ${responseCount}, Numeric Responses: ${numericAnswers.length}, Average: ${average}`);
        }
        
        return { ...q, options: opts, average, responseCount };
      });
      
      setQuestions(merged);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchQuestions();
  }, [quizId, refreshTrigger]);

  if (loading) return <p className="text-gray-500">Loading questions...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;
  if (questions.length === 0) return <p className="text-gray-500">No questions found.</p>;

  return (
    <div className="space-y-4">
      {questions.map((q) => (
        <div key={q.question_id} className="border p-4 rounded-md bg-gray-50 hover:bg-gray-100 transition">
          <div className="flex justify-between items-start">
            <h3 className="font-medium text-lg text-gray-900">{q.question_text}</h3>
            <div className="flex gap-2 items-start">
              {q.average !== undefined && (
                <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-semibold">
                  Avg: {q.average.toFixed(2)}
                </div>
              )}
              <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full uppercase font-bold tracking-wide">
                {q.type}
              </span>
            </div>
          </div>
          
          {q.type === 'multiple_choice' && q.options.length > 0 && (
            <ul className="mt-2 ml-4 list-disc text-gray-600 text-sm">
              {q.options.map((opt, idx) => (
                <li key={idx}>{opt}</li>
              ))}
            </ul>
          )}

          {/* Edit controls for correct answer and points */}
          <div className="mt-3">
            {editingId === q.question_id ? (
              <div className="space-y-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Correct Answer (optional)</label>
                  <input
                    type="text"
                    value={editCorrect}
                    onChange={(e) => setEditCorrect(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Points</label>
                  <input
                    type="number"
                    min={0}
                    value={editPoints as any}
                    onChange={(e) => setEditPoints(e.target.value === '' ? '' : Number(e.target.value))}
                    className="mt-1 block w-32 rounded-md border-gray-300 shadow-sm p-2"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      // Save changes
                      try {
                        const updates: any = { correct_answer: editCorrect || null };
                        if (editPoints !== '') updates.points = editPoints || 0;

                        const { data, error } = await supabase
                          .from('questions')
                          .update(updates)
                          .eq('question_id', q.question_id)
                          .select()
                          .single();

                        if (error) throw error;

                        // Update local state
                        setQuestions(prev => prev.map(item => item.question_id === q.question_id ? { ...item, ...data } : item));
                        setEditingId(null);
                      } catch (err: any) {
                        alert('Error saving question: ' + (err.message || JSON.stringify(err)));
                      }
                    }}
                    className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white rounded"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="inline-flex items-center px-3 py-1.5 bg-gray-200 text-gray-800 rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingId(q.question_id);
                    setEditCorrect((q as any).correct_answer || '');
                    setEditPoints((q as any).points ?? 0);
                  }}
                  className="inline-flex items-center px-3 py-1.5 bg-indigo-600 text-white rounded"
                >
                  Edit
                </button>
                <button
                  onClick={async () => {
                    const ok = confirm('Delete this question? This will also remove its options and responses.');
                    if (!ok) return;
                    try {
                      // delete question
                      const { error: delQErr } = await supabase
                        .from('questions')
                        .delete()
                        .eq('question_id', q.question_id);
                      if (delQErr) throw delQErr;

                      // delete options
                      const { error: delOErr } = await supabase
                        .from('questionoptions')
                        .delete()
                        .eq('question_id', q.question_id);
                      if (delOErr) throw delOErr;

                      // delete responses
                      const { error: delRErr } = await supabase
                        .from('responses')
                        .delete()
                        .eq('question_id', q.question_id);
                      if (delRErr) throw delRErr;

                      // update UI
                      setQuestions(prev => prev.filter(item => item.question_id !== q.question_id));
                    } catch (err: any) {
                      alert('Error deleting question: ' + (err.message || JSON.stringify(err)));
                    }
                  }}
                  className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white rounded"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default QuestionList;
