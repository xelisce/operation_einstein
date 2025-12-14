'use client';

import QuestionForm from "@/components/QuestionForm";
import QuestionList from "@/components/QuestionList";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-gray-900">Operation Einstein</h1>
        <p className="text-gray-600 mt-2">Teacher Interface - Question Management</p>
      </header>
      
      <main className="max-w-4xl mx-auto space-y-8">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800 border-b pb-2">Create New Question</h2>
          <QuestionForm />
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-6 border-b pb-2">
            <h2 className="text-2xl font-semibold text-gray-800">Existing Questions</h2>
            <button 
              onClick={() => window.location.reload()} 
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              Refresh List
            </button>
          </div>
          <QuestionList />
        </div>
      </main>
    </div>
  );
}