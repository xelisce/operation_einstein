'use client';

import { useState, useRef, useEffect } from 'react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { createWorker } from 'tesseract.js';

export default function ScanPage() {
  const params = useParams();
  const classId = params.classId as string;
  const quizId = params.quizId as string;

  // Data State
  const [questions, setQuestions] = useState<any[]>([]);
  const [studentId, setStudentId] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState('');

  // Image State
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Result State
  const [extractedText, setExtractedText] = useState('');
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch Data
  useEffect(() => {
    supabase.from('questions')
      .select('*')
      .eq('assignment_id', quizId)
      .then(({ data }) => setQuestions(data || []));
  }, [quizId]);

  // Handle Image Selection
  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined);
      const reader = new FileReader();
      reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // Handle Scan (Client-Side)
  const handleScan = async () => {
    if (!completedCrop || !imgRef.current || !fileInputRef.current?.files?.[0]) return;

    setScanning(true);
    
    const image = imgRef.current;
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const canvas = document.createElement('canvas');
    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      setScanning(false);
      return;
    }

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const dataUrl = canvas.toDataURL('image/png');

    try {
      const worker = await createWorker('eng');
      const { data: { text } } = await worker.recognize(dataUrl);
      await worker.terminate();
      setExtractedText(text);
    } catch (error: any) {
      console.error(error);
      alert(`Scan failed: ${error.message}`);
    } finally {
      setScanning(false);
    }
  };

  // Handle Save (Supabase)
  const handleSave = async () => {
    if (!studentId || !selectedQuestion) {
      alert('Please select a student and question');
      return;
    }

    setSaving(true);
    
    const { error } = await supabase
      .from('responses')
      .insert([{
        question_id: selectedQuestion,
        student_id: studentId,
        answer_text: extractedText
      }]);

    if (error) {
      alert(`Error saving response: ${error.message}`);
    } else {
      alert('Response saved successfully!');
      setExtractedText('');
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-indigo-700 px-6 py-4 flex justify-between items-center">
          <h1 className="text-white text-xl font-bold">Smart Grading Scanner</h1>
          <Link href={`/classes/${classId}/quizzes/${quizId}`} className="text-indigo-200 hover:text-white text-sm">
            Close Scanner
          </Link>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <input 
              type="file" 
              accept="image/*" 
              onChange={onSelectFile} 
              ref={fileInputRef}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg min-h-[400px] flex items-center justify-center bg-gray-100 overflow-auto relative">
              {imgSrc ? (
                <ReactCrop 
                  crop={crop} 
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                >
                  <img ref={imgRef} alt="Upload" src={imgSrc} style={{ maxWidth: '100%' }} />
                </ReactCrop>
              ) : (
                <p className="text-gray-400">Upload a worksheet to start</p>
              )}
            </div>
            
            <div className="flex justify-center">
              <button 
                onClick={handleScan}
                disabled={!completedCrop || scanning}
                className="bg-indigo-600 text-white px-8 py-3 rounded-full shadow-lg hover:bg-indigo-700 disabled:bg-gray-400 font-semibold transition transform hover:scale-105"
              >
                {scanning ? 'Scanning...' : '🔍 Read Selection'}
              </button>
            </div>
          </div>

          <div className="space-y-6 border-l pl-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
              <input 
                type="text" 
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="Enter Student ID"
                className="w-full border rounded-md p-2 placeholder:text-gray-500 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
              <select 
                value={selectedQuestion} 
                onChange={(e) => setSelectedQuestion(e.target.value)}
                className="w-full border rounded-md p-2 text-gray-900"
              >
                <option value="">Select Question...</option>
                {questions.map(q => (
                  <option key={q.question_id} value={q.question_id}>{q.question_text?.substring(0, 40)}...</option>
                ))}
              </select>
            </div>

            <hr />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Extracted Answer</label>
              <textarea
                value={extractedText}
                onChange={(e) => setExtractedText(e.target.value)}
                rows={6}
                className="w-full border rounded-md p-2 font-mono text-lg bg-yellow-50 placeholder:text-gray-500 text-gray-900"
                placeholder="Scan result will appear here..."
              />
            </div>

            <button 
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-green-600 text-white py-3 rounded-md hover:bg-green-700 font-bold shadow-md"
            >
              {saving ? 'Saving...' : '✅ Save Grade'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}