'use client';

import { useEffect, useState } from 'react';

type Question = {
  _id: string;
  text: string;
  type: string;
  options: string[];
  createdAt: string;
};

type Props = {
  quizId?: string;
  refreshTrigger?: number;
};

const QuestionList = ({ quizId, refreshTrigger }: Props) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchQuestions = async () => {
    try {
      let url = 'http://127.0.0.1:5001/api/questions';
      if (quizId) url += `?quizId=${quizId}`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch questions');
      const data = await res.json();
      setQuestions(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
        <div key={q._id} className="border p-4 rounded-md bg-gray-50 hover:bg-gray-100 transition">
          <div className="flex justify-between items-start">
            <h3 className="font-medium text-lg text-gray-900">{q.text}</h3>
            <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full uppercase font-bold tracking-wide">
              {q.type}
            </span>
          </div>
          
          {q.type === 'multiple-choice' && q.options.length > 0 && (
            <ul className="mt-2 ml-4 list-disc text-gray-600 text-sm">
              {q.options.map((opt, idx) => (
                <li key={idx}>{opt}</li>
              ))}
            </ul>
          )}
          
          <p className="text-xs text-gray-400 mt-2">ID: {q._id}</p>
        </div>
      ))}
    </div>
  );
};

export default QuestionList;
