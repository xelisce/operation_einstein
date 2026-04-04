"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import RichTextEditor from "./richTextEditor";
import "./print.css";
import type { Project, ProjectQuestion } from "../../models/types";
import { useAuth } from "../../useAuth";
import { authFetch } from "../../lib/auth";

type AnswerPayload = { html: string; delta: unknown };

function toSafeFilename(raw: string): string {
  const cleaned = raw
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return cleaned || "final-report";
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function buildExportHtml(
  title: string,
  questions: ProjectQuestion[],
  answers: Record<string, AnswerPayload>,
): string {
  const blocks = questions
    .map((q, i) => {
      const answerHtml =
        answers[q.projectQuestionId]?.html || "<p><em>No entry written.</em></p>";
      return `
        <div style="margin-bottom:36px; page-break-inside:avoid; break-inside:avoid;">
          <div style="font-size:11px; font-weight:700; letter-spacing:0.1em; color:#6366f1; text-transform:uppercase; margin-bottom:4px;">Day ${i + 1}</div>
          ${q.prompt ? `<p style="font-size:12px; color:#6b7280; font-style:italic; margin:0 0 10px 0;">Focus: ${escapeHtml(q.prompt)}</p>` : ""}
          <div style="font-size:14px; line-height:1.75; color:#1f2937; border-left:3px solid #e5e7eb; padding-left:14px;">${answerHtml}</div>
        </div>`;
    })
    .join("\n");

  return `
    <h1 style="font-size:26px; font-weight:700; margin:0 0 4px 0; color:#000;">${escapeHtml(title)}</h1>
    <p style="font-size:13px; color:#6b7280; margin:0 0 32px 0; padding-bottom:24px; border-bottom:2px solid #e5e7eb;">Workshop Journal</p>
    ${blocks}`;
}

export default function ProjectJournalPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams<{ projectId: string }>();
  const projectId = params?.projectId;

  const [project, setProject] = useState<Project | null>(null);
  const [questions, setQuestions] = useState<ProjectQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, AnswerPayload>>({});
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!projectId || !user || hasFetched.current) return;
    hasFetched.current = true;

    async function load() {
      setLoading(true);
      try {
        const base = process.env.NEXT_PUBLIC_API_BASE_URL;
        const [pRes, qRes, rRes] = await Promise.all([
          fetch(`${base}/api/projects/${projectId}`),
          fetch(`${base}/api/projects/${projectId}/questions`),
          authFetch(`${base}/api/projects/${projectId}/responses`),
        ]);
        if (!pRes.ok) throw new Error("Failed to load project");
        if (!qRes.ok) throw new Error("Failed to load questions");

        const p: Project = await pRes.json();
        const qs: ProjectQuestion[] = await qRes.json();
        setProject(p);
        setQuestions(qs);

        const savedMap: Record<string, AnswerPayload> = {};
        for (const q of qs) {
          savedMap[q.projectQuestionId] = { html: "", delta: null };
        }
        if (rRes.ok) {
          const saved: { questionId: string; contentHtml: string; contentDelta: unknown }[] = await rRes.json();
          for (const r of saved) {
            if (savedMap[r.questionId] !== undefined) {
              savedMap[r.questionId] = { html: r.contentHtml ?? "", delta: r.contentDelta ?? null };
            }
          }
        }
        setAnswers(savedMap);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [projectId, user]);

  const title = useMemo(
    () => (loading ? "Loading…" : (project?.title ?? "Untitled Project")),
    [loading, project]
  );

  const handleSave = async () => {
    if (!projectId || isSaving) return;
    setIsSaving(true);
    setSaveStatus("idle");
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE_URL;
      const responses = questions.map((q) => ({
        questionId: q.projectQuestionId,
        contentHtml: answers[q.projectQuestionId]?.html ?? "",
        contentDelta: answers[q.projectQuestionId]?.delta ?? null,
      }));
      const res = await authFetch(`${base}/api/projects/${projectId}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses }),
      });
      setSaveStatus(res.ok ? "saved" : "error");
    } catch {
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const handleExportPdf = async () => {
    if (isExporting) return;
    setIsExporting(true);
    let iframe: HTMLIFrameElement | null = null;
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import("jspdf"),
        import("html2canvas"),
      ]);

      const htmlContent = buildExportHtml(title, questions, answers);
      const filename = `${toSafeFilename(project?.title ?? "")}.pdf`;
      iframe = document.createElement("iframe");
      iframe.style.cssText = "position:fixed; left:-9999px; top:0; width:794px; height:1123px; border:none;";
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) throw new Error("Cannot access iframe document");

      iframeDoc.open();
      iframeDoc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { background:#fff; color:#000; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif; font-size:14px; line-height:1.6; padding:40px; width:794px; }
        h1 { font-size:26px; font-weight:700; margin:0 0 4px 0; }
        .answer p { margin:0 0 8px 0; } .answer ul,.answer ol { margin:4px 0 4px 20px; } .answer li { margin-bottom:2px; }
        .answer blockquote { margin:8px 0 8px 16px; padding-left:10px; border-left:3px solid #ccc; color:#555; }
        .answer table { width:100%; border-collapse:collapse; margin:8px 0; }
        .answer th,.answer td { border:1px solid #ccc; padding:4px 8px; text-align:left; }
        .answer th { background:#f5f5f5; font-weight:600; }
        .answer pre { background:#f6f6f6; padding:8px; border-radius:4px; white-space:pre-wrap; }
        .answer code { background:#f6f6f6; padding:1px 4px; border-radius:3px; font-size:13px; }
        .answer img { max-width:100%; height:auto; }
        .answer a { color:#4f46e5; text-decoration:underline; }
      </style></head><body>${htmlContent}</body></html>`);
      iframeDoc.close();

      await new Promise<void>((r) => setTimeout(r, 500));
      const body = iframeDoc.body;
      const canvas = await html2canvas(body, {
        scale: 2, useCORS: true, backgroundColor: "#fff",
        width: 794, height: body.scrollHeight,
        windowWidth: 794, windowHeight: body.scrollHeight, logging: false,
      });

      const margin = 10;
      const contentWidth = 210 - margin * 2;
      const contentHeight = 297 - margin * 2;
      const scale = contentWidth / canvas.width;
      const totalMm = canvas.height * scale;
      const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

      let yOffset = 0, page = 0;
      while (yOffset < totalMm) {
        if (page > 0) doc.addPage();
        const sourceY = yOffset / scale;
        const sourceH = Math.min(contentHeight / scale, canvas.height - sourceY);
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = sourceH;
        const ctx = pageCanvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(canvas, 0, sourceY, canvas.width, sourceH, 0, 0, canvas.width, sourceH);
          doc.addImage(pageCanvas.toDataURL("image/png"), "PNG", margin, margin, contentWidth, sourceH * scale);
        }
        yOffset += contentHeight;
        page++;
      }

      doc.save(filename);
      const formData = new FormData();
      formData.append("file", doc.output("blob"), filename);
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/email/send-report`, { method: "POST", body: formData });
    } catch (e) {
      console.error("[PDF Export] failed:", e);
    } finally {
      if (iframe?.parentNode) document.body.removeChild(iframe);
      setIsExporting(false);
    }
  };

  const activeQuestion = questions[activeDay] ?? null;
  const daysWithContent = questions.filter(
    (q) => (answers[q.projectQuestionId]?.html ?? "").trim().length > 0
  ).length;

  if (!projectId) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b shadow-sm shrink-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="min-w-0 flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="text-sm text-indigo-600 hover:text-indigo-800 shrink-0"
            >
              &larr; Back
            </button>
            <div className="h-4 w-px bg-gray-200" />
            <div className="min-w-0">
              <h1 className="text-base font-bold text-gray-900 truncate">{title}</h1>
              <p className="text-xs text-gray-400">Workshop Journal</p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {!loading && (
              <span className="text-xs text-gray-400 hidden sm:block">
                {daysWithContent} of {questions.length} days logged
              </span>
            )}
            {saveStatus === "saved" && <span className="text-xs text-green-600 font-medium">Saved ✓</span>}
            {saveStatus === "error" && <span className="text-xs text-red-500 font-medium">Save failed</span>}
            <button
              onClick={handleSave}
              disabled={isSaving || loading}
              className="text-sm border border-indigo-600 text-indigo-600 px-4 py-1.5 rounded-lg hover:bg-indigo-50 font-medium transition disabled:opacity-40"
            >
              {isSaving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={handleExportPdf}
              disabled={isExporting || loading}
              className="text-sm bg-indigo-600 text-white px-4 py-1.5 rounded-lg hover:bg-indigo-700 font-medium transition shadow-sm disabled:opacity-40"
            >
              {isExporting ? "Generating…" : "Export PDF"}
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-indigo-500 animate-pulse">
          Loading journal…
        </div>
      ) : (
        <div className="flex-1 flex max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 gap-6">

          {/* Day selector sidebar */}
          <aside className="w-44 shrink-0">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">Days</p>
            <nav className="space-y-1">
              {questions.map((q, i) => {
                const hasContent = (answers[q.projectQuestionId]?.html ?? "").trim().length > 0;
                const isActive = activeDay === i;
                return (
                  <button
                    key={q.projectQuestionId}
                    onClick={() => setActiveDay(i)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${
                      isActive
                        ? "bg-indigo-600 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        hasContent
                          ? isActive ? "bg-indigo-200" : "bg-indigo-500"
                          : isActive ? "bg-indigo-400" : "bg-gray-300"
                      }`}
                    />
                    Day {i + 1}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Journal entry panel */}
          {activeQuestion ? (
            <div className="flex-1 min-w-0">
              {/* Day header */}
              <div className="mb-4">
                <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-1">
                  Day {activeDay + 1}
                </p>
                {activeQuestion.prompt && (
                  <p className="text-sm text-gray-500 italic">
                    Focus: {activeQuestion.prompt}
                  </p>
                )}
              </div>

              {/* Editor */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden answer-block">
                <div className="px-6 pt-5 pb-1 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-800">What did you do today?</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Document your progress, observations, and reflections.</p>
                </div>
                <div className="p-6">
                  <RichTextEditor
                    value={answers[activeQuestion.projectQuestionId]?.html ?? ""}
                    placeholder="Write about what you worked on, what you discovered, any challenges you faced…"
                    onChange={({ html, delta }) =>
                      setAnswers((a) => ({
                        ...a,
                        [activeQuestion.projectQuestionId]: { html, delta },
                      }))
                    }
                    className="rounded-md min-h-[320px]"
                  />
                </div>
              </div>

              {/* Prev / Next navigation */}
              <div className="flex justify-between mt-4">
                <button
                  onClick={() => setActiveDay((d) => Math.max(0, d - 1))}
                  disabled={activeDay === 0}
                  className="text-sm text-indigo-600 hover:text-indigo-800 disabled:text-gray-300 font-medium transition"
                >
                  &larr; Previous day
                </button>
                <button
                  onClick={() => setActiveDay((d) => Math.min(questions.length - 1, d + 1))}
                  disabled={activeDay === questions.length - 1}
                  className="text-sm text-indigo-600 hover:text-indigo-800 disabled:text-gray-300 font-medium transition"
                >
                  Next day &rarr;
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              No days set up for this project yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
