"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import RichTextEditor from "./richTextEditor";
import "./print.css";
import type { Project, ProjectQuestion } from "../../models/types";

export default function FinalReportPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params?.projectId;
  const [project, setProject] = useState<Project | null>(null);
  const [questions, setQuestions] = useState<ProjectQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isPrinting, setIsPrinting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const afterPrint = () => setIsPrinting(false);
    window.addEventListener("afterprint", afterPrint);
    return () => window.removeEventListener("afterprint", afterPrint);
  }, []);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const base = process.env.NEXT_PUBLIC_API_BASE_URL;
        const [pRes, qRes] = await Promise.all([
          fetch(`${base}/api/projects/${projectId}`),
          fetch(`${base}/api/projects/${projectId}/questions`),
        ]);
        if (!pRes.ok) throw new Error("Failed to load project");
        if (!qRes.ok) throw new Error("Failed to load questions");
        const p: Project = await pRes.json();
        const qs: ProjectQuestion[] = await qRes.json();
        if (cancelled) return;

        setProject(p);
        setQuestions(qs);
        setAnswers((prev) => {
          const next = { ...prev };
          for (const q of qs) {
            if (next[q.projectQuestionId] === undefined) next[q.projectQuestionId] = "";
          }
          return next;
        });
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const title = useMemo(() => {
    if (!projectId) return "Loading…";
    if (loading) return "Loading…";
    return project?.title ?? "Untitled Project";
  }, [projectId, loading, project]);

  const handlePrint = () => {
    setIsPrinting(true);
    requestAnimationFrame(() => window.print());
  };

  if (!projectId) {
    return (
      <div className="min-h-screen bg-white text-black">
        <div className="max-w-3xl mx-auto px-4 py-8">Loading…</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-white text-black ${isPrinting ? "print-mode" : ""}`}>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-10 print-page">
        {/* Project Title */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">{title}</h1>
        </div>

        {/* Questions */}
        {questions.map((q) => (
          <div key={q.projectQuestionId} className="space-y-2 answer-block">
            <h3 className="text-lg font-semibold">{q.prompt}</h3>
            <RichTextEditor
              value={answers[q.projectQuestionId] ?? ""}
              placeholder="Write your answer here..."
              onChange={(html) =>
                setAnswers((a) => ({ ...a, [q.projectQuestionId]: html }))
              }
              className="rounded-md"
            />
          </div>
        ))}

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
