"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import RichTextEditor from "./richTextEditor";
import "./print.css";
import type { Project, ProjectQuestion } from "../../models/types";
type AnswerPayload = { html: string; delta: unknown };

export default function FinalReportPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params?.projectId;
  const [project, setProject] = useState<Project | null>(null);
  const [questions, setQuestions] = useState<ProjectQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, AnswerPayload>>({});
  const [isPrinting, setIsPrinting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

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
        const [pRes, qRes, rRes] = await Promise.all([
          fetch(`${base}/api/projects/${projectId}`),
          fetch(`${base}/api/projects/${projectId}/questions`),
          fetch(`${base}/api/projects/${projectId}/responses`),
        ]);
        if (!pRes.ok) throw new Error("Failed to load project");
        if (!qRes.ok) throw new Error("Failed to load questions");
        if (!rRes.ok) throw new Error("Failed to load responses");

        const p: Project = await pRes.json();
        const qs: ProjectQuestion[] = await qRes.json();
        const rs: Array<{
          questionId: string;
          contentHtml: string;
          contentDelta: unknown;
        }> = await rRes.json();
        if (cancelled) return;

        setProject(p);
        setQuestions(qs);
        const respByQ = new Map(rs.map((r) => [r.questionId, r]));
        setAnswers(() => {
          const next: Record<string, AnswerPayload> = {};
          for (const q of qs) {
            const saved = respByQ.get(q.projectQuestionId);
            next[q.projectQuestionId] = {
              html: saved?.contentHtml ?? "",
              delta: saved?.contentDelta ?? null,
            };
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
    if (!projectId || loading) return "Loading…";
    return project?.title ?? "Untitled Project";
  }, [projectId, loading, project]);

  const handlePrint = () => {
    setIsPrinting(true);
    requestAnimationFrame(() => window.print());
  };

  const handleSave = async () => {
    if (!projectId) return;

    try {
      setSaveStatus("saving");
      const base = process.env.NEXT_PUBLIC_API_BASE_URL;
      const payload = questions.map((q) => ({
        projectId,
        questionId: q.projectQuestionId,
        contentHtml: answers[q.projectQuestionId]?.html ?? "",
        contentDelta: answers[q.projectQuestionId]?.delta ?? null,
      }));

      const resp = await fetch(`${base}/api/projects/${projectId}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses: payload }),
      });

      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt);
      }

      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 1200);
    } catch (e) {
      console.error(e);
      setSaveStatus("error");
    }
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
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">{title}</h1>
        </div>

        {questions.map((q) => (
          <div key={q.projectQuestionId} className="space-y-2 answer-block">
            <h3 className="text-lg font-semibold">{q.prompt}</h3>
            <RichTextEditor
              value={answers[q.projectQuestionId]?.html ?? ""}
              placeholder="Write your answer here..."
              onChange={({ html, delta }) =>
                setAnswers((a) => ({ ...a, [q.projectQuestionId]: { html, delta } }))
              }
              className="rounded-md"
            />
          </div>
        ))}

        <div className="pt-2 no-print flex gap-3">
          <button
            onClick={handleSave}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium shadow-sm hover:bg-gray-50 active:scale-[0.99]"
          >
            {saveStatus === "saving"
              ? "Saving..."
              : saveStatus === "saved"
                ? "Saved ✓"
                : saveStatus === "error"
                  ? "Save failed"
                  : "Save"}
          </button>

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
