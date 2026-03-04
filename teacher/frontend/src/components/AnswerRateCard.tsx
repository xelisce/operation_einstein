'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type AnswerRateData = {
  quizId: string;
  quizTitle?: string;
  classId: string;
  className?: string;
  assignedCount: number;
  startedCount: number;      // responded at least once
  finishedCount: number;     // answered all questions
  startedRate: number;
  finishedRate: number;
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

      // 2. retrieve question IDs for this quiz
      const { data: qData, error: qErr } = await supabase
        .from('questions')
        .select('question_id')
        .eq('assignment_id', quizId);
      if (qErr) throw qErr;

      const questionIds = (qData || []).map(q => q.question_id);

      let startedCount = 0;
      let finishedCount = 0;

      if (questionIds.length > 0) {
        // fetch responses for those questions
        const { data: responses, error: rErr } = await supabase
          .from('responses')
          .select('student_id,question_id')
          .in('question_id', questionIds);
        if (rErr) throw rErr;

        const studentMap: Record<string, Set<string>> = {};
        (responses || []).forEach((r: any) => {
          const sid = r.student_id;
          if (!studentMap[sid]) studentMap[sid] = new Set();
          studentMap[sid].add(r.question_id);
        });
        startedCount = Object.keys(studentMap).length;
        finishedCount = Object.values(studentMap).filter(s => s.size === questionIds.length).length;
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
        startedCount,
        finishedCount,
        startedRate: assignedCount > 0 ? (startedCount / assignedCount) * 100 : 0,
        finishedRate: assignedCount > 0 ? (finishedCount / assignedCount) * 100 : 0,
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

  // threshold constants
  const YELLOW_THRESH = 60;
  const GREEN_THRESH = 80;
  // colors for each bar
  const startedColor =
    data.startedRate >= GREEN_THRESH ? 'text-green-600' :
    data.startedRate >= YELLOW_THRESH ? 'text-yellow-600' :
    'text-orange-600';
  const finishedColor =
    data.finishedRate >= GREEN_THRESH ? 'text-green-600' :
    data.finishedRate >= YELLOW_THRESH ? 'text-yellow-600' :
    'text-orange-600';

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        {data.quizTitle}
      </h3>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div>
          <p className="text-sm text-gray-600">Assigned Students</p>
          <p className="text-2xl font-bold text-gray-900">
            {data.assignedCount}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Started</p>
          <p className="text-2xl font-bold text-gray-900">
            {data.startedCount}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Finished</p>
          <p className="text-2xl font-bold text-gray-900">
            {data.finishedCount}
          </p>
        </div>
      </div>

      {/* Bars for started and finished rates */}
      <div className="space-y-4 mb-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Started Rate</span>
            <span className={`text-2xl font-bold ${startedColor}`}>{data.startedRate.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all duration-300 ${
                data.startedRate >= GREEN_THRESH ? 'bg-green-500' :
                data.startedRate >= YELLOW_THRESH ? 'bg-yellow-500' :
                'bg-orange-500'
              }`}
              style={{ width: `${data.startedRate}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Finished Rate</span>
            <span className={`text-2xl font-bold ${finishedColor}`}>{data.finishedRate.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all duration-300 ${
                data.finishedRate >= GREEN_THRESH ? 'bg-green-500' :
                data.finishedRate >= YELLOW_THRESH ? 'bg-yellow-500' :
                'bg-orange-500'
              }`}
              style={{ width: `${data.finishedRate}%` }}
            />
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        Class: <span className="font-semibold">{data.className}</span>
      </p>
    </div>
  );
};

export default AnswerRateCard;
