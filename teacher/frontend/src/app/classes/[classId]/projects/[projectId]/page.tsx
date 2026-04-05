'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Project = {
  project_id: string;
  title: string;
  workshop_id: string;
};

type ProjectQuestion = {
  question_id: string;
  project_id: string;
  prompt: string;
  position: number;
};

type ProjectResponse = {
  response_id: string;
  project_id: string;
  question_id: string;
  content_html: string;
  student_id: string;
};

type StudentProfile = {
  id: string;
  name: string;
};

export default function ProjectDetail() {
  const params = useParams();
  const classId = params.classId as string;
  const projectId = params.projectId as string;
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [questions, setQuestions] = useState<ProjectQuestion[]>([]);
  const [responses, setResponses] = useState<ProjectResponse[]>([]);
  const [students, setStudents] = useState<Record<string, string>>({}); // id -> name
  const [newPrompt, setNewPrompt] = useState('');
  const [loading, setLoading] = useState(true);

  // editing title
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');

  // viewing responses
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  const fetchProject = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (error) console.error(error);
    else setProject(data);
    setLoading(false);
  };

  const fetchQuestions = async () => {
    const { data, error } = await supabase
      .from('project_questions')
      .select('*')
      .eq('project_id', projectId)
      .order('position', { ascending: true });

    if (error) console.error(error);
    else setQuestions(data || []);
  };

  const fetchResponses = async () => {
    const { data, error } = await supabase
      .from('project_responses')
      .select('response_id, project_id, question_id, content_html, student_id')
      .eq('project_id', projectId);

    if (error) console.error(error);
    else {
      setResponses(data || []);
      // Fetch student names for all unique student_ids
      const studentIds = [...new Set((data || []).map((r: ProjectResponse) => r.student_id))];
      if (studentIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', studentIds);
        if (profiles) {
          const map: Record<string, string> = {};
          profiles.forEach((p: StudentProfile) => { map[p.id] = p.name; });
          setStudents(map);
        }
      }
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchProject();
      fetchQuestions();
      fetchResponses();
    }
  }, [projectId]);

  useEffect(() => {
    if (project) setTitleInput(project.title);
  }, [project]);

  const handleAddPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrompt.trim()) return;

    // Auto-increment position
    const nextPosition = questions.length > 0
      ? Math.max(...questions.map(q => q.position)) + 1
      : 1;

    const { error } = await supabase
      .from('project_questions')
      .insert([{
        project_id: projectId,
        prompt: newPrompt,
        position: nextPosition,
      }]);

    if (error) {
      alert(`Failed to add prompt: ${error.message}`);
    } else {
      setNewPrompt('');
      fetchQuestions();
    }
  };

  const handleDeletePrompt = async (questionId: string) => {
    if (!confirm('Delete this prompt? Student responses for this prompt will also be deleted.')) return;

    // Delete responses first
    await supabase.from('project_responses').delete().eq('question_id', questionId);
    // Delete question
    const { error } = await supabase.from('project_questions').delete().eq('question_id', questionId);

    if (error) {
      alert(`Failed to delete: ${error.message}`);
    } else {
      fetchQuestions();
      fetchResponses();
    }
  };

  const handleDeleteProject = async () => {
    if (!confirm('Delete this entire project? All prompts and student responses will be permanently removed.')) return;

    try {
      // Cascade delete: responses -> questions -> project
      const questionIds = questions.map(q => q.question_id);
      if (questionIds.length > 0) {
        await supabase.from('project_responses').delete().in('question_id', questionIds);
        await supabase.from('project_questions').delete().in('question_id', questionIds);
      }
      const { error } = await supabase.from('projects').delete().eq('project_id', projectId);
      if (error) throw error;

      router.push(`/classes/${classId}`);
    } catch (err: any) {
      alert(`Failed to delete project: ${err.message || JSON.stringify(err)}`);
    }
  };

  const handleSaveTitle = async () => {
    if (!titleInput.trim() || !projectId) return;
    const { error } = await supabase
      .from('projects')
      .update({ title: titleInput })
      .eq('project_id', projectId);
    if (error) alert(`Failed to update title: ${error.message}`);
    else {
      setProject(prev => prev ? { ...prev, title: titleInput } : prev);
      setEditingTitle(false);
    }
  };

  const getResponsesForQuestion = (questionId: string) => {
    return responses.filter(r => r.question_id === questionId);
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading project...</div>;
  if (!project) return <div className="p-8 text-center text-red-500">Project not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-2 mb-2 text-sm">
            <Link href={`/classes/${classId}`} className="text-indigo-600 hover:text-indigo-800">
              &larr; Back to Workshop
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-gray-500">Project Detail</span>
          </div>

          <div className="flex items-center gap-2">
            {editingTitle ? (
              <>
                <input
                  value={titleInput}
                  onChange={e => setTitleInput(e.target.value)}
                  className="text-3xl font-bold text-gray-900 border-b-2 focus:outline-none"
                />
                <button onClick={handleSaveTitle} className="text-green-600 hover:text-green-800 text-sm">Save</button>
                <button onClick={() => { setEditingTitle(false); setTitleInput(project.title); }} className="text-gray-600 hover:text-gray-800 text-sm">Cancel</button>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-gray-900">{project.title}</h1>
                <button onClick={() => setEditingTitle(true)} className="text-indigo-600 hover:text-indigo-800 text-sm ml-2">Edit</button>
              </>
            )}
          </div>

          <div className="mt-4 flex items-center gap-4">
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded font-medium">
              {questions.length} prompt{questions.length !== 1 ? 's' : ''}
            </span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">
              {[...new Set(responses.map(r => r.student_id))].length} student response{[...new Set(responses.map(r => r.student_id))].length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={handleDeleteProject}
              className="ml-auto bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700 text-sm"
            >
              Delete Project
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Add Prompt */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Add Prompt</h2>
          <form onSubmit={handleAddPrompt} className="flex gap-3">
            <input
              type="text"
              value={newPrompt}
              onChange={(e) => setNewPrompt(e.target.value)}
              placeholder="Enter the prompt / question for students (e.g. 'What did you learn today?')"
              className="flex-1 border rounded px-3 py-2 text-sm placeholder:text-gray-400 text-gray-900"
              required
            />
            <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 text-sm font-medium whitespace-nowrap">
              Add Prompt
            </button>
          </form>
        </div>

        {/* Prompts List */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
            Prompts ({questions.length})
          </h2>

          {questions.length === 0 ? (
            <div className="text-center py-12 text-gray-400 bg-gray-50 rounded border-2 border-dashed">
              No prompts added yet. Add your first prompt above.
            </div>
          ) : (
            <div className="space-y-3">
              {questions.map((q, idx) => {
                const qResponses = getResponsesForQuestion(q.question_id);
                const isExpanded = expandedQuestion === q.question_id;

                return (
                  <div key={q.question_id} className="border rounded-lg overflow-hidden">
                    <div className="flex items-center gap-4 p-4 bg-white">
                      <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded whitespace-nowrap">
                        Day {idx + 1}
                      </span>
                      <p className="flex-1 text-gray-900 font-medium">{q.prompt}</p>
                      <div className="flex items-center gap-2">
                        {qResponses.length > 0 && (
                          <button
                            onClick={() => setExpandedQuestion(isExpanded ? null : q.question_id)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {isExpanded ? 'Hide' : 'View'} {qResponses.length} response{qResponses.length !== 1 ? 's' : ''}
                          </button>
                        )}
                        <button
                          onClick={() => handleDeletePrompt(q.question_id)}
                          className="text-xs text-red-500 hover:text-red-700 font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Expanded Responses */}
                    {isExpanded && qResponses.length > 0 && (
                      <div className="border-t bg-gray-50 p-4 space-y-3">
                        {qResponses.map((r) => (
                          <div key={r.response_id} className="bg-white rounded border p-3">
                            <p className="text-xs font-medium text-gray-500 mb-1">
                              {students[r.student_id] || r.student_id}
                            </p>
                            <div
                              className="text-sm text-gray-700 prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{ __html: r.content_html || '<em class="text-gray-400">No response</em>' }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
