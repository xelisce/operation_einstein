"use client";
import { useState } from "react";
import RichTextEditor from "./richTextEditor";

export default function FinalReportPage() {
  const [answers, setAnswers] = useState<Record<string, string>>({
    q1: "",
    q2: "",
  });

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-10">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Question 1</h3>
          <RichTextEditor
            value={answers.q1}
            placeholder="Type your answer for Question 1..."
            onChange={(html) => setAnswers((a) => ({ ...a, q1: html }))}
            className="rounded-md"
          />
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Question 2</h3>
          <RichTextEditor
            value={answers.q2}
            placeholder="Type your answer for Question 2..."
            onChange={(html) => setAnswers((a) => ({ ...a, q2: html }))}
            className="rounded-md"
          />
        </div>

        <div className="pt-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium shadow-sm hover:bg-gray-50 active:scale-[0.99]"
          >
            Export / Print to PDF
          </button>
        </div>
      </div>
    </div>
  );
}
