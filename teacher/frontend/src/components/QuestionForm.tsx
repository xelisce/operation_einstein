'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

type Props = {
  quizId?: string; // assignment_id
  onQuestionCreated?: () => void;
};

const QuestionForm = ({ quizId, onQuestionCreated }: Props) => {
  const [text, setText] = useState('');
  const [type, setType] = useState('text');
  const [options, setOptions] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizId) return;
    setLoading(true);

    try {
      // 1. Insert Question
      const { data: qData, error: qError } = await supabase
        .from('questions')
        .insert([
          {
            assignment_id: quizId,
            question_text: text,
            type: type,
            question_order: Math.floor(Math.random() * 10000) // Safe integer
          }
        ])
        .select()
        .single();

      if (qError) throw qError;

      // 2. Insert Options (if MC)
      if (type === 'multiple-choice' && options) {
        const opts = options.split(',').map((o, idx) => ({
          question_id: qData.question_id,
          option_text: o.trim(),
          option_order: idx + 1
        }));

        const { error: oError } = await supabase
          .from('questionoptions')
          .insert(opts);
          
        if (oError) throw oError;
      }

      alert('Question created successfully!');
      setText('');
      setOptions('');
      setType('text');
      if (onQuestionCreated) onQuestionCreated();
    } catch (error: any) {
      console.error('Full Error Object:', error);
      console.error('Error Details:', error.details);
      console.error('Error Hint:', error.hint);
      alert(`Error: ${error.message || JSON.stringify(error)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="text" className="block text-sm font-medium text-gray-700">Question Text</label>
        <input
          id="text"
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
          required
        />
      </div>

      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700">Type</label>
        <select
          id="type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
        >
          <option value="text">Text</option>
          <option value="multiple-choice">Multiple Choice</option>
        </select>
      </div>

      {type === 'multiple-choice' && (
        <div>
          <label htmlFor="options" className="block text-sm font-medium text-gray-700">Options (comma separated)</label>
          <input
            id="options"
            type="text"
            value={options}
            onChange={(e) => setOptions(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
            placeholder="Option 1, Option 2, Option 3"
          />
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${loading ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
      >
        {loading ? 'Saving...' : 'Save Question'}
      </button>
    </form>
  );
};

export default QuestionForm;