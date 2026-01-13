'use client';

import { useEffect, useState } from 'react';

type ResponseType = {
  _id: string;
  studentId: string;
  answer: string;
  questionId: { text: string };
  quizId: { title: string };
  createdAt: string;
};

type Props = {
  quizId?: string;
  refreshTrigger?: number;
};

const ResponseViewer = ({ quizId, refreshTrigger }: Props) => {
  const [responses, setResponses] = useState<ResponseType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchResponses = async () => {
    try {
      let url = 'http://127.0.0.1:5001/api/responses';
      if (quizId) url += `?quizId=${quizId}`;
      
      const res = await fetch(url);
      const data = await res.json();
      setResponses(data);
    } catch (error) {
      console.error('Failed to fetch responses', error);
    } finally {
      setLoading(false);
    }
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
                <th className="px-6 py-3">Quiz</th>
                <th className="px-6 py-3">Question</th>
                <th className="px-6 py-3">Answer</th>
                <th className="px-6 py-3">Time</th>
              </tr>
            </thead>
            <tbody>
              {responses.map((res) => (
                <tr key={res._id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{res.studentId}</td>
                  <td className="px-6 py-4">{res.quizId?.title || 'Unknown Quiz'}</td>
                  <td className="px-6 py-4">{res.questionId?.text || 'Unknown Question'}</td>
                  <td className="px-6 py-4 text-gray-900">{res.answer}</td>
                  <td className="px-6 py-4">{new Date(res.createdAt).toLocaleString()}</td>
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
