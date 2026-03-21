'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Workshop = {
  workshop_id: string;
  title: string;
  code: string;
  workshop_date?: string;
};

type Assignment = {
  assignment_id: string;
  title: string;
  created_at: string;
};

export default function CategoryDetail() {
  const params = useParams();
  const categoryId = params.categoryId as string;

  const [category, setCategory] = useState<{id: string; name: string; code: string} | null>(null);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [categoryWorkshops, setCategoryWorkshops] = useState<Workshop[]>([]);
  const [newWorkshopTitle, setNewWorkshopTitle] = useState('');
  const [newWorkshopDate, setNewWorkshopDate] = useState('');
  const [copyFrom, setCopyFrom] = useState('');
  const [loading, setLoading] = useState(true);

  // editing title
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');

  // delete functionality
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const router = useRouter();

  const fetchCategory = async () => {
    const { data: cat, error: cErr } = await supabase
      .from('categories')
      .select('*')
      .eq('id', categoryId)
      .single();

    if (cErr) console.error(cErr);
    else setCategory(cat);

    const { data: ws, error: wErr } = await supabase
      .from('workshops')
      .select('*')
      .eq('category_id', categoryId);

    if (wErr) console.error(wErr);
    else setWorkshops(ws || []);
    setLoading(false);
  };

  const fetchCategoryWorkshops = async () => {
    const { data, error } = await supabase
      .from('workshops')
      .select('workshop_id, title, code')
      .eq('category_id', categoryId)
      .order('code');

    if (error) console.error(error);
    else setCategoryWorkshops(data || []);
  };

  useEffect(() => {
    fetchCategory();
    fetchCategoryWorkshops();
  }, [categoryId]);

  const copyWorkshopContent = async (sourceWorkshopId: string, targetWorkshopId: string) => {
    // Copy assignments (quizzes)
    const { data: assignments, error: assErr } = await supabase
      .from('assignments')
      .select('*')
      .eq('workshop_id', sourceWorkshopId);

    if (assErr) {
      console.error('Error fetching assignments:', assErr);
      return;
    }

    for (const assignment of assignments || []) {
      const newAssignment = {
        ...assignment,
        assignment_id: undefined,
        workshop_id: targetWorkshopId,
        created_at: undefined,
        updated_at: undefined
      };

      const { data: newAssData, error: newAssErr } = await supabase
        .from('assignments')
        .insert(newAssignment)
        .select();

      if (newAssErr) {
        console.error('Error creating assignment:', newAssErr);
        continue;
      }

      const newAssignmentId = newAssData[0].assignment_id;

      // Copy questions
      const { data: questions, error: qErr } = await supabase
        .from('questions')
        .select('*')
        .eq('assignment_id', assignment.assignment_id);

      if (qErr) {
        console.error('Error fetching questions:', qErr);
        continue;
      }

      for (const question of questions || []) {
        const newQuestion = {
          ...question,
          question_id: undefined,
          assignment_id: newAssignmentId,
          created_at: undefined,
          updated_at: undefined
        };

        const { data: newQData, error: newQErr } = await supabase
          .from('questions')
          .insert(newQuestion)
          .select();

        if (newQErr) {
          console.error('Error creating question:', newQErr);
          continue;
        }

        const newQuestionId = newQData[0].question_id;

        // Copy question options
        const { data: options, error: optErr } = await supabase
          .from('questionoptions')
          .select('*')
          .eq('question_id', question.question_id);

        if (optErr) {
          console.error('Error fetching options:', optErr);
          continue;
        }

        const newOptions = (options || []).map(option => ({
          ...option,
          questionoption_id: undefined,
          question_id: newQuestionId,
          created_at: undefined,
          updated_at: undefined
        }));

        if (newOptions.length > 0) {
          const { error: newOptErr } = await supabase
            .from('questionoptions')
            .insert(newOptions);

          if (newOptErr) {
            console.error('Error creating options:', newOptErr);
          }
        }
      }
    }
  };

  const generateWorkshopCode = async () => {
    if (!category) return '';

    const { data, error } = await supabase
      .from('workshops')
      .select('code')
      .eq('category_id', categoryId)
      .order('code', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching codes:', error);
      return '';
    }

    let nextNum = 1;
    if (data && data.length > 0) {
      const lastCode = data[0].code;
      const parts = lastCode.split('-');
      if (parts.length === 2 && parts[0] === category.code) {
        const num = parseInt(parts[1], 10);
        if (!isNaN(num)) nextNum = num + 1;
      }
    }

    return `${category.code}-${nextNum.toString().padStart(3, '0')}`;
  };

  const handleCreateWorkshop = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const code = await generateWorkshopCode();

    const { data: newWorkshopData, error } = await supabase
      .from('workshops')
      .insert([
        {
          title: newWorkshopTitle,
          code,
          category_id: categoryId,
          workshop_date: newWorkshopDate,
          color: 'blue',
          term: '2025-T1'
        }
      ])
      .select();

    if (error) {
      alert(`Error creating workshop: ${error.message}`);
      setLoading(false);
      return;
    }

    const newWorkshopId = newWorkshopData[0].workshop_id;

    if (copyFrom) {
      await copyWorkshopContent(copyFrom, newWorkshopId);
    }

    setNewWorkshopTitle('');
    setNewWorkshopDate('');
    setCopyFrom('');
    fetchCategory();
    setLoading(false);
  };

  const handleDeleteCategory = async () => {
    if (!category) return;

    // Check if category has workshops
    if (workshops.length > 0) {
      // Force delete - requires confirmation text
      if (deleteConfirmText !== category.name) {
        alert('Please type the exact category name to confirm deletion.');
        return;
      }

      // Delete all workshops first (this will cascade to related data)
      for (const workshop of workshops) {
        const { error: workshopError } = await supabase
          .from('workshops')
          .delete()
          .eq('workshop_id', workshop.workshop_id);

        if (workshopError) {
          console.error('Error deleting workshop:', workshopError);
          alert(`Failed to delete workshop ${workshop.title}: ${workshopError.message}`);
          return;
        }
      }
    }

    // Delete the category
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (error) {
      alert(`Failed to delete category: ${error.message}`);
    } else {
      router.push('/');
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/" className="text-blue-600 hover:underline">← Back to Categories</Link>
      </div>

      <div className="flex items-center gap-2 mb-2">
        {editingTitle ? (
          <>
            <input
              value={titleInput}
              onChange={e => setTitleInput(e.target.value)}
              className="text-3xl font-bold text-gray-900 border-b-2 focus:outline-none"
            />
            <button
              onClick={async () => {
                if (!titleInput.trim() || !categoryId) return;
                const { error } = await supabase
                  .from('categories')
                  .update({ name: titleInput })
                  .eq('id', categoryId);
                if (error) alert(`Failed to update title: ${error.message}`);
                else {
                  setCategory(prev => prev ? { ...prev, name: titleInput } : prev);
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
                setTitleInput(category?.name || '');
              }}
              className="text-gray-600 hover:text-gray-800 text-sm"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-gray-900">{category?.name} Workshops</h1>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditingTitle(true);
                  setTitleInput(category?.name || '');
                }}
                className="text-indigo-600 hover:text-indigo-800 text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Delete
              </button>
            </div>
          </>
        )}
      </div>
      <p className="text-gray-500 mb-6">Code: {category?.code}</p>

      {/* Create New Workshop */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Create New Workshop</h2>
        <form onSubmit={handleCreateWorkshop} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Workshop Title</label>
              <input
                type="text"
                value={newWorkshopTitle}
                onChange={(e) => setNewWorkshopTitle(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 border p-2 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-gray-500 text-gray-900"
                required
                placeholder="e.g. Introduction to Biology"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                value={newWorkshopDate}
                onChange={(e) => setNewWorkshopDate(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 border p-2 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Copy from existing workshop (optional)</label>
            <select
              value={copyFrom}
              onChange={(e) => setCopyFrom(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 border p-2 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
            >
              <option value="">-- Select workshop to copy from --</option>
              {categoryWorkshops.map((workshop) => (
                <option key={workshop.workshop_id} value={workshop.workshop_id}>
                  {workshop.code} - {workshop.title}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:bg-gray-400 font-medium transition-colors"
          >
            {loading ? 'Adding...' : 'Add Workshop'}
          </button>
        </form>
      </div>

      {/* Workshops List */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Workshops in this Category</h2>
        {workshops.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <p className="text-gray-500">No workshops found. Create one to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workshops.map((workshop) => (
              <Link key={workshop.workshop_id} href={`/classes/${workshop.workshop_id}`}>
                <div className="block bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100 cursor-pointer h-full group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
                      <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {workshop.code}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">
                    {workshop.title}
                  </h3>
                  {workshop.workshop_date && (
                    <p className="text-sm text-gray-500 mb-1">Date: {new Date(workshop.workshop_date).toLocaleDateString()}</p>
                  )}
                  <p className="text-sm text-gray-500">Manage assignments</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {workshops.length > 0 ? 'Force Delete Category' : 'Delete Category'}
            </h3>
            <p className="text-gray-600 mb-4">
              {workshops.length > 0
                ? `This category contains ${workshops.length} workshop(s). Deleting it will permanently remove all workshops and their associated data.`
                : 'Are you sure you want to delete this category?'
              }
            </p>
            {workshops.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type "{category?.name}" to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder={`Type ${category?.name}`}
                />
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCategory}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400"
                disabled={workshops.length > 0 && deleteConfirmText !== category?.name}
              >
                {workshops.length > 0 ? 'Force Delete' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}