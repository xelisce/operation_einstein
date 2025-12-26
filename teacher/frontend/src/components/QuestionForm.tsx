'use client';

import { useState } from 'react';

type Props = {
  quizId?: string;
  onQuestionCreated?: () => void;
};

const QuestionForm = ({ quizId, onQuestionCreated }: Props) => {
  const [text, setText] = useState('');
  const [type, setType] = useState('text');
  const [options, setOptions] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('image', file);

    setUploading(true);
    try {
      const res = await fetch('http://127.0.0.1:5001/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setText(data.text.trim());
    } catch (error) {
      console.error(error);
      alert('Failed to scan image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const questionData = {
      text,
      type,
      options: type === 'multiple-choice' ? options.split(',').map(o => o.trim()) : [],
      quizId, // Include quizId
    };

    try {
      const res = await fetch('http://127.0.0.1:5001/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(questionData),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create question');
      }

      alert('Question created successfully!');
      setText('');
      setOptions('');
      setType('text');
      if (onQuestionCreated) onQuestionCreated();
    } catch (error: any) {
      console.error(error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white rounded shadow-md max-w-md mx-auto">
      <div className="border-b pb-4 mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Auto-fill from Image (OCR)</label>
        <input 
          type="file" 
          accept="image/*"
          onChange={handleImageUpload}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-indigo-50 file:text-indigo-700
            hover:file:bg-indigo-100"
        />
        {uploading && <p className="text-xs text-indigo-600 mt-1">Scanning image...</p>}
      </div>

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
          <option value="scale">Scale</option>
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
