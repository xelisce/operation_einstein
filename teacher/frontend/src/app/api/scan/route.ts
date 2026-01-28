import { NextRequest, NextResponse } from 'next/server';
import { createWorker } from 'tesseract.js';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log('Starting Tesseract...');
    // Tesseract Logic
    const worker = await createWorker('eng');
    console.log('Worker created. Recognizing...');
    const { data: { text } } = await worker.recognize(buffer);
    console.log('Recognition complete.');
    await worker.terminate();

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error('OCR Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
