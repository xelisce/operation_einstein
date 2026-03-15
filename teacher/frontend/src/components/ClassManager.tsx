'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type Category = {
  id: string;
  name: string;
  code: string;
};

const ClassManager = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryName, setCategoryName] = useState('');
  const [categoryCode, setCategoryCode] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (error) console.error('Error fetching categories:', error);
    else setCategories(data || []);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (categoryCode.length !== 3) {
      alert('Category code must be exactly 3 letters');
      return;
    }
    setLoading(true);

    const { error } = await supabase
      .from('categories')
      .insert([
        { 
          name: categoryName,
          code: categoryCode.toUpperCase()
        }
      ]);

    if (error) {
      alert(`Error creating category: ${error.message}`);
    } else {
      setCategoryName('');
      setCategoryCode('');
      fetchCategories();
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      {/* Manage Categories Section */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Manage Categories</h2>
        <form onSubmit={handleCreateCategory} className="flex gap-4 items-end mb-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">Category Name</label>
            <input
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 border p-2 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-gray-500 text-gray-900"
              required
              placeholder="e.g. Biology"
            />
          </div>
          <div className="w-32">
            <label className="block text-sm font-medium text-gray-700">Code (3 letters)</label>
            <input
              type="text"
              value={categoryCode}
              onChange={(e) => setCategoryCode(e.target.value.toUpperCase())}
              className="mt-1 block w-full rounded-md border-gray-300 border p-2 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-gray-500 text-gray-900"
              required
              placeholder="BIO"
              maxLength={3}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 font-medium transition-colors"
          >
            {loading ? 'Adding...' : 'Add Category'}
          </button>
        </form>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <Link key={cat.id} href={`/categories/${cat.id}`}>
              <div className="block bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100 cursor-pointer h-full group">
                <div className="p-2 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors mb-4">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-sm text-gray-500">Code: {cat.code}</p>
                <p className="text-sm text-gray-500">View workshops</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClassManager;
