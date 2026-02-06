"use client";

import { useEffect, useState } from "react";
import RichTextEditor from "./richTextEditor";
import "./print.css";

export default function FinalReportPage() {
  const [answers, setAnswers] = useState<Record<string, string>>({
    q1: "",
    q2: "",
  });

  // Used to apply print-mode class before calling window.print()
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    // afterprint is still useful to reset UI state once print dialog closes
    const afterPrint = () => setIsPrinting(false);

    window.addEventListener("afterprint", afterPrint);
    return () => {
      window.removeEventListener("afterprint", afterPrint);
    };
  }, []);

  const handlePrint = () => {
    // Force print-mode styles (hide toolbar, keep box) before printing
    setIsPrinting(true);

    // Ensure React commits the DOM update before print dialog opens
    requestAnimationFrame(() => {
      window.print();
    });
  };

  return (
    <div
      className={`min-h-screen bg-white text-black ${
        isPrinting ? "print-mode" : ""
      }`}
    >
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-10 print-page">
        <div className="space-y-2 answer-block">
          <h3 className="text-lg font-semibold">Question 1</h3>

          <RichTextEditor
            value={answers.q1}
            placeholder="Type your answer for Question 1..."
            onChange={(html) => setAnswers((a) => ({ ...a, q1: html }))}
            className="rounded-md"
          />
        </div>

        <div className="space-y-2 answer-block">
          <h3 className="text-lg font-semibold">Question 2</h3>

          <RichTextEditor
            value={answers.q2}
            placeholder="Type your answer for Question 2..."
            onChange={(html) => setAnswers((a) => ({ ...a, q2: html }))}
            className="rounded-md"
          />
        </div>

        <div className="pt-2 no-print flex gap-3">
          <button
            onClick={handlePrint}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium shadow-sm hover:bg-gray-50 active:scale-[0.99]"
          >
            Export to PDF (Print)
          </button>
        </div>
      </div>
    </div>
  );
}
