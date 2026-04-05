'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Workshop = {
  workshop_id: string;
  title: string;
  code: string;
  category_id: string;
};

type Assignment = {
  assignment_id: string;
  title: string;
  created_at: string; // Supabase returns string timestamps
};

type Project = {
  project_id: string;
  title: string;
  workshop_id: string;
};

export default function ClassDetail() {
  const params = useParams();
  const classId = params.classId as string;
  
  const [classData, setClassData] = useState<Workshop | null>(null);
  const [quizzes, setQuizzes] = useState<Assignment[]>([]);
  const [students, setStudents] = useState<any[]>([]); // Enrollments
  const [projects, setProjects] = useState<Project[]>([]);
  const [newQuizTitle, setNewQuizTitle] = useState('');
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newStudentId, setNewStudentId] = useState(''); // For enrolling
  const [newStudentName, setNewStudentName] = useState(''); // For creating new student
  const [showNameInput, setShowNameInput] = useState(false);
  const [activeTab, setActiveTab] = useState<'quizzes' | 'students' | 'projects'>('quizzes');
  const [loading, setLoading] = useState(true);

  // editing title
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');

  const router = useRouter();

  const fetchClass = async () => {
    const { data, error } = await supabase
      .from('workshops')
      .select('*')
      .eq('workshop_id', classId)
      .single();
    
    if (error) console.error(error);
    else setClassData(data);
    setLoading(false);
  };

  const fetchQuizzes = async () => {
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('workshop_id', classId)
      .eq('assignment_type', 'assignment')
      .order('title');

    if (error) console.error(error);
    else setQuizzes(data || []);
  };

  const fetchStudents = async () => {
    // Fetch enrollments and join profiles table to get the name
    const { data, error } = await supabase
      .from('enrollments')
      .select('*, profiles(name)')
      .eq('workshop_id', classId);

    if (error) console.error(error);
    else setStudents(data || []);
  };

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('workshop_id', classId)
      .order('title');

    if (error) console.error(error);
    else setProjects(data || []);
  };

  // delete handler moved out of JSX
  const handleDeleteClass = async () => {
    if (!classId) return;
    if (!confirm('Are you sure you want to delete this workshop? This cannot be undone.')) return;
    try {
      // cascade delete steps
      const { data: assignments, error: aErr } = await supabase
        .from('assignments')
        .select('assignment_id')
        .eq('workshop_id', classId);
      if (aErr) throw aErr;

      const assignmentIds = (assignments || []).map((a: any) => a.assignment_id);
      let questionIds: string[] = [];

      if (assignmentIds.length) {
        const { data: questions, error: qErr } = await supabase
          .from('questions')
          .select('question_id')
          .in('assignment_id', assignmentIds);
        if (qErr) throw qErr;
        questionIds = (questions || []).map((q: any) => q.question_id);
      }

      if (questionIds.length) {
        await supabase.from('responses').delete().in('question_id', questionIds);
        await supabase.from('questionoptions').delete().in('question_id', questionIds);
        await supabase.from('questions').delete().in('question_id', questionIds);
      }

      if (assignmentIds.length) {
        await supabase.from('assignments').delete().in('assignment_id', assignmentIds);
      }

      // Delete projects and their questions/responses
      const { data: projects, error: pErr } = await supabase
        .from('projects')
        .select('project_id')
        .eq('workshop_id', classId);
      if (pErr) throw pErr;

      const projectIds = (projects || []).map((p: any) => p.project_id);

      if (projectIds.length) {
        const { data: projectQuestions, error: pqErr } = await supabase
          .from('project_questions')
          .select('question_id')
          .in('project_id', projectIds);
        if (pqErr) throw pqErr;

        const projectQuestionIds = (projectQuestions || []).map((q: any) => q.question_id);

        if (projectQuestionIds.length) {
          await supabase.from('project_responses').delete().in('question_id', projectQuestionIds);
          await supabase.from('project_questions').delete().in('question_id', projectQuestionIds);
        }

        await supabase.from('projects').delete().in('project_id', projectIds);
      }

      await supabase.from('enrollments').delete().eq('workshop_id', classId);

      const { error } = await supabase
        .from('workshops')
        .delete()
        .eq('workshop_id', classId);
      if (error) throw error;

      router.push('/');
    } catch (err: any) {
      alert(`Failed to delete: ${err.message || JSON.stringify(err)}`);
    }
  };

  useEffect(() => {
    if (classId) {
      fetchClass();
      fetchQuizzes();
      fetchStudents();
      fetchProjects();
    }
  }, [classId]);

  // when class data loads, initialize title input
  useEffect(() => {
    if (classData) {
      setTitleInput(classData.title);
    }
  }, [classData]);

  const handleEnrolStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentId.trim()) return;

    // 1. Check if student exists in profiles
    const { data: student, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', newStudentId)
      .single();

    if (!student) {
      alert('Student not found. Ensure the student has registered an account and provide their valid User UUID.');
      return;
    }

    // 2. Create Enrollment
    const { error: enrolError } = await supabase
      .from('enrollments')
      .insert([{ workshop_id: classId, student_id: newStudentId }]);

    if (enrolError) {
      alert(`Error enrolling: ${enrolError.message}`); // Likely duplicate key if already enrolled
    } else {
      alert('Student enrolled successfully!');
      setNewStudentId('');
      fetchStudents();
    }
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuizTitle.trim()) return;

    // assignment_id is generated by default (uuid)
    const { error } = await supabase
      .from('assignments')
      .insert([
        {
          workshop_id: classId,
          title: newQuizTitle,
          assignment_type: 'assignment',
          points: 100, // Default
          due_date: new Date().toISOString() // Placeholder date
        }
      ]);

    if (error) {
      alert(`Failed to create quiz: ${error.message}`);
    } else {
      setNewQuizTitle('');
      fetchQuizzes();
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectTitle.trim()) return;

    const { error } = await supabase
      .from('projects')
      .insert([{ workshop_id: classId, title: newProjectTitle }]);

    if (error) {
      alert(`Failed to create project: ${error.message}`);
    } else {
      setNewProjectTitle('');
      fetchProjects();
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading class details...</div>;
  if (!classData) return <div className="p-8 text-center text-red-500">Class not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link href={`/categories/${classData.category_id}`} className="text-sm text-indigo-600 hover:text-indigo-800 mb-2 inline-block">
            &larr; Back to Category
          </Link>
          <div className="flex items-center gap-2">
            {editingTitle ? (
              <>
                <input
                  value={titleInput}
                  onChange={e => setTitleInput(e.target.value)}
                  className="text-3xl font-bold text-gray-900 border-b-2 focus:outline-none"
                />
                <button
                  onClick={async () => {
                    if (!titleInput.trim() || !classId) return;
                    const { error } = await supabase
                      .from('workshops')
                      .update({ title: titleInput })
                      .eq('workshop_id', classId);
                    if (error) alert(`Failed to update title: ${error.message}`);
                    else {
                      setClassData(prev => prev ? { ...prev, title: titleInput } : prev);
                      setEditingTitle(false);
                    }
                  }}
                  className="text-green-600 hover:text-green-800 text-sm"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditingTitle(false);
                    setTitleInput(classData.title);
                  }}
                  className="text-gray-600 hover:text-gray-800 text-sm"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-gray-900">{classData.title}</h1>
                <button
                  onClick={() => setEditingTitle(true)}
                  className="text-indigo-600 hover:text-indigo-800 text-sm ml-2"
                >
                  Edit
                </button>
              </>
            )}
          </div>
          <p className="text-gray-500">{classData.code}</p>

          {/* analytics link and management buttons */}
          <div className="mt-4 flex items-center gap-4">
            <Link
              href={`/classes/${classId}/analytics`}
              className="inline-block bg-indigo-600 text-white px-4 py-1 rounded hover:bg-indigo-700 text-sm"
            >
              View Analytics
            </Link>
            <button
              onClick={handleDeleteClass}
              className="inline-block bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700 text-sm"
            >
              Delete Class
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mt-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('quizzes')}
              className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'quizzes' 
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Assignments (Quizzes)
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'projects' 
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Projects
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'students' 
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Students (Roster)
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'quizzes' && (
          <div className="bg-white p-6 rounded-lg shadow-sm border space-y-6">
            <div className="flex justify-between items-end border-b pb-6">
              <h2 className="text-xl font-semibold text-gray-800">Assigned Quizzes</h2>
              <form onSubmit={handleCreateQuiz} className="flex gap-2">
                <input
                  type="text"
                  value={newQuizTitle}
                  onChange={(e) => setNewQuizTitle(e.target.value)}
                  placeholder="New Quiz Title"
                  className="border rounded px-3 py-1 text-sm w-64 placeholder:text-gray-500 text-gray-900"
                  required
                />
                <button type="submit" className="bg-indigo-600 text-white px-4 py-1 rounded hover:bg-indigo-700 text-sm">
                  Create
                </button>
              </form>
            </div>

            {quizzes.length === 0 ? (
              <div className="text-center py-12 text-gray-400 bg-gray-50 rounded border-2 border-dashed">
                No quizzes created yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {quizzes.map((quiz) => (
                  <Link 
                    key={quiz.assignment_id} 
                    href={`/classes/${classId}/quizzes/${quiz.assignment_id}`}
                    className="block border p-4 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition"
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-lg text-gray-900">{quiz.title}</h3>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="bg-white p-6 rounded-lg shadow-sm border space-y-6">
            <div className="flex justify-between items-end border-b pb-6">
              <h2 className="text-xl font-semibold text-gray-800">Projects</h2>
              <form onSubmit={handleCreateProject} className="flex gap-2">
                <input
                  type="text"
                  value={newProjectTitle}
                  onChange={(e) => setNewProjectTitle(e.target.value)}
                  placeholder="New Project Title"
                  className="border rounded px-3 py-1 text-sm w-64 placeholder:text-gray-500 text-gray-900"
                  required
                />
                <button type="submit" className="bg-indigo-600 text-white px-4 py-1 rounded hover:bg-indigo-700 text-sm">
                  Create
                </button>
              </form>
            </div>

            {projects.length === 0 ? (
              <div className="text-center py-12 text-gray-400 bg-gray-50 rounded border-2 border-dashed">
                No projects created yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {projects.map((project) => (
                  <Link
                    key={project.project_id}
                    href={`/classes/${classId}/projects/${project.project_id}`}
                    className="block border p-4 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">{project.title}</h3>
                        <p className="text-sm text-gray-500">Open-ended project</p>
                      </div>
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded font-medium">Project</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'students' && (
          <div className="bg-white p-6 rounded-lg shadow-sm border space-y-6">
            <div className="flex justify-between items-end border-b pb-6">
              <h2 className="text-xl font-semibold text-gray-800">Class Roster ({students.length})</h2>
              
              <form onSubmit={handleEnrolStudent} className="flex gap-2 items-end">
                <div>
                  <input
                    type="text"
                    value={newStudentId}
                    onChange={(e) => setNewStudentId(e.target.value)}
                    placeholder="Student UUID"
                    className="border rounded px-3 py-1 text-sm w-64 placeholder:text-gray-500 text-gray-900"
                    required
                  />
                </div>
                <button type="submit" className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700 text-sm">
                  Enrol
                </button>
              </form>
            </div>
            
            {students.length === 0 ? (
              <div className="text-center py-12 text-gray-400 bg-gray-50 rounded border-2 border-dashed">
                No students enrolled.
              </div>
            ) : (
              <div className="overflow-hidden border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID (UUID)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((s) => (
                      <tr key={s.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {s.profiles?.name || 'Unknown Name'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {s.student_id}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
