'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

type Student = {
  id: string;
  email: string;
  name: string;
};

interface StudentSearchInputProps {
  onSelectStudent: (studentId: string) => void;
  selectedStudentId?: string;
}

const StudentSearchInput = ({ onSelectStudent, selectedStudentId }: StudentSearchInputProps) => {
  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState<Student[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Search for students by email
  const handleSearch = async (query: string) => {
    setSearchInput(query);
    setSelectedIndex(-1);

    if (!query.trim()) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, name')
        .ilike('email', `%${query}%`)
        .order('email')
        .limit(10);

      if (error) {
        console.error('Error searching students:', error);
        setSuggestions([]);
      } else {
        setSuggestions(data || []);
        setIsOpen(true);
      }
    } catch (err) {
      console.error('Error:', err);
      setSuggestions([]);
    }
  };

  const handleSelectStudent = (student: Student) => {
    setSearchInput(`${student.email} [${student.id}]`);
    setSuggestions([]);
    setIsOpen(false);
    onSelectStudent(student.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelectStudent(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSuggestions([]);
        break;
      default:
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        value={searchInput}
        onChange={(e) => handleSearch(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => searchInput && setSuggestions(suggestions.length > 0 ? suggestions : [])}
        placeholder="Search student by email..."
        className="w-full border rounded px-3 py-2 text-sm placeholder:text-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((student, index) => (
            <div
              key={student.id}
              onClick={() => handleSelectStudent(student)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`px-3 py-2 cursor-pointer text-sm ${
                index === selectedIndex
                  ? 'bg-blue-500 text-white'
                  : 'hover:bg-gray-100 text-gray-900'
              }`}
            >
              <div className="flex justify-between items-center">
                <span>{student.email}</span>
                <span className={index === selectedIndex ? 'text-blue-100' : 'text-gray-500'}>
                  [{student.id.slice(0, 8)}...]
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {isOpen && searchInput && suggestions.length === 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg px-3 py-2 text-sm text-gray-500">
          No students found
        </div>
      )}
    </div>
  );
};

export default StudentSearchInput;
