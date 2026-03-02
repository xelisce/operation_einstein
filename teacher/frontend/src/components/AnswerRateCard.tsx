'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type AnswerRateData = {
  quizId: string;
  quizTitle?: string;
  classId: string;
  className?: string;
  assignedCount: number;
  completedCount: number;
  answerRate: number;
};

type Props = {
  quizId: string;            // assignment_id
  classId: string;           // workshop_id
  quizTitle?: string;        // optional display title
  refreshTrigger?: number;
};

const AnswerRateCard = ({ quizId, classId, quizTitle, refreshTrigger }: Props) => {
  const [data, setData] = useState<AnswerRateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnswerRate = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. count assigned students via enrollments
      const { data: enrollments, error: eErr } = await supabase
        .from('enrollments')
        .select('student_id')
        .eq('workshop_id', classId);
      if (eErr) throw eErr;

      const assignedCount = new Set((enrollments || []).map(e => e.student_id)).size;

      // 2. count distinct students who have responses for this quiz
      // first retrieve all question IDs belonging to the assignment
      const { data: qData, error: qErr } = await supabase
        .from('questions')
        .select('question_id')
        .eq('assignment_id', quizId);
      if (qErr) throw qErr;

      const questionIds = (qData || []).map(q => q.question_id);

      let completedCount = 0;
      if (questionIds.length > 0) {
        const { data: responses, error: rErr } = await supabase
          .from('responses')
          .select('student_id')
          .in('question_id', questionIds);
        if (rErr) throw rErr;
        completedCount = new Set((responses || []).map(r => r.student_id)).size;
      }

      // 3. optionally fetch the quiz title if not provided
      let quizTitleLocal = quizTitle;
      if (!quizTitleLocal) {
        const { data: aData, error: aErr } = await supabase
          .from('assignments')
          .select('title')
          .eq('assignment_id', quizId)
          .single();
        if (aErr) console.warn(aErr.message);
        quizTitleLocal = aData?.title;
      }

      // 4. fetch class name for display
      const { data: wData, error: wErr } = await supabase
        .from('workshops')
        .select('title')
        .eq('workshop_id', classId)
        .single();
      if (wErr) console.warn(wErr.message);

      setData({
        quizId,
        quizTitle: quizTitleLocal,
        classId,
        className: wData?.title,
        assignedCount,
        completedCount,
        answerRate: assignedCount > 0 ? (completedCount / assignedCount) * 100 : 0
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnswerRate();
  }, [quizId, refreshTrigger]);

  if (loading) return <div className="text-gray-500">Loading answer rate...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!data) return <div className="text-gray-500">No data available</div>;

  // Determine color based on answer rate
  const rateColor =
    data.answerRate >= 80 ? 'text-green-600' :
    data.answerRate >= 60 ? 'text-yellow-600' :
    'text-orange-600';

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Answer Rate: {data.quizTitle}</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-sm text-gray-600">Assigned Students</p>
          <p className="text-2xl font-bold text-gray-900">{data.assignedCount}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Completed</p>
          <p className="text-2xl font-bold text-gray-900">{data.completedCount}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Completion Rate</span>
          <span className={`text-2xl font-bold ${rateColor}`}>{data.answerRate.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className={`h-4 rounded-full transition-all duration-300 ${
              data.answerRate >= 80 ? 'bg-green-500' :
              data.answerRate >= 60 ? 'bg-yellow-500' :
              'bg-orange-500'
            }`}
            style={{ width: `${data.answerRate}%` }}
          />
        </div>
      </div>

      <p className="text-xs text-gray-500">
        Class: <span className="font-semibold">{data.className}</span>
      </p>
    </div>
  );
};

export default AnswerRateCard;
