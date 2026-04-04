"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
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
    .map((q) => {
      const answerHtml =
        answers[q.projectQuestionId]?.html || "<p><em>No answer provided.</em></p>";
      return `
        <div style="margin-bottom:24px; page-break-inside:avoid; break-inside:avoid;">
          <h3 style="font-size:16px; font-weight:600; margin:0 0 8px 0; color:#111111;">${escapeHtml(q.prompt)}</h3>
          <div style="font-size:14px; line-height:1.65; color:#222222;">${answerHtml}</div>
        </div>`;
    })
    .join("\n");

  return `
    <h1 style="font-size:24px; font-weight:700; margin:0 0 24px 0; color:#000000;">
      ${escapeHtml(title)}
    </h1>
    ${blocks}`;
}

export default function FinalReportPage() {
  const { user } = useAuth();
  const params = useParams<{ projectId: string }>();
  const projectId = params?.projectId;

  const [project, setProject] = useState<Project | null>(null);
  const [questions, setQuestions] = useState<ProjectQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, AnswerPayload>>({});
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!projectId || !user || hasFetched.current) return;
    hasFetched.current = true;

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

        setProject(p);
        setQuestions(qs);

        const empty: Record<string, AnswerPayload> = {};
        for (const q of qs) {
          empty[q.projectQuestionId] = { html: "", delta: null };
        }
        setAnswers(empty);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [projectId, user]);

  const title = useMemo(() => {
    if (!projectId || loading) return "Loading…";
    return project?.title ?? "Untitled Project";
  }, [projectId, loading, project]);

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
      iframe.style.cssText =
        "position:fixed; left:-9999px; top:0; width:794px; height:1123px; border:none;";
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) throw new Error("Cannot access iframe document");

      iframeDoc.open();
      iframeDoc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #ffffff;
      color: #000000;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      padding: 40px;
      width: 794px;
    }
    h1 { font-size: 24px; font-weight: 700; margin: 0 0 24px 0; color: #000; }
    h3 { font-size: 16px; font-weight: 600; margin: 0 0 8px 0; color: #111; }
    .answer p { margin: 0 0 8px 0; }
    .answer ul, .answer ol { margin: 4px 0 4px 20px; }
    .answer li { margin-bottom: 2px; }
    .answer blockquote { margin: 8px 0 8px 16px; padding-left: 10px; border-left: 3px solid #ccc; color: #555; }
    .answer table { width: 100%; border-collapse: collapse; margin: 8px 0; }
    .answer th, .answer td { border: 1px solid #ccc; padding: 4px 8px; text-align: left; }
    .answer th { background: #f5f5f5; font-weight: 600; }
    .answer pre { background: #f6f6f6; padding: 8px; border-radius: 4px; overflow-x: auto; white-space: pre-wrap; }
    .answer code { background: #f6f6f6; padding: 1px 4px; border-radius: 3px; font-size: 13px; }
    .answer img { max-width: 100%; height: auto; }
    .answer a { color: #1a56db; text-decoration: underline; }
  </style>
</head>
<body>${htmlContent}</body>
</html>`);
      iframeDoc.close();

      await new Promise<void>((resolve) => setTimeout(resolve, 500));

      const body = iframeDoc.body;
      console.log("[PDF Export] iframe body size:", body.scrollWidth, "x", body.scrollHeight);

      const canvas = await html2canvas(body, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        width: 794,
        height: body.scrollHeight,
        windowWidth: 794,
        windowHeight: body.scrollHeight,
        logging: false,
      });

      console.log("[PDF Export] canvas size:", canvas.width, "x", canvas.height);

      const pdfWidth = 210;
      const margin = 10;
      const contentWidth = pdfWidth - margin * 2;
      const contentHeight = 297 - margin * 2;
      const scale = contentWidth / canvas.width;
      const totalImgHeightMm = canvas.height * scale;

      const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

      let yOffset = 0;
      let page = 0;

      while (yOffset < totalImgHeightMm) {
        if (page > 0) doc.addPage();

        const sourceY = yOffset / scale;
        const sourceHeight = Math.min(contentHeight / scale, canvas.height - sourceY);
        const destHeight = sourceHeight * scale;

        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = sourceHeight;
        const ctx = pageCanvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(
            canvas,
            0, sourceY,
            canvas.width, sourceHeight,
            0, 0,
            canvas.width, sourceHeight,
          );
          const pageImgData = pageCanvas.toDataURL("image/png");
          doc.addImage(pageImgData, "PNG", margin, margin, contentWidth, destHeight);
        }

        yOffset += contentHeight;
        page++;
      }

      doc.save(filename);
      const pdfBlob = doc.output("blob");
      const formData = new FormData();
      formData.append("file", pdfBlob, filename);
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/email/send-report`, {
        method: "POST",
        body: formData,
      });
      console.log("[PDF Export] success, pages:", page);
    } catch (e) {
      console.error("[PDF Export] failed:", e);
    } finally {
      if (iframe?.parentNode) {
        document.body.removeChild(iframe);
      }
      setIsExporting(false);
    }
  };

  if (!projectId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-8 text-gray-500">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <a href="javascript:history.back()" className="text-sm text-indigo-600 hover:text-indigo-800 mb-2 inline-block">
            &larr; Back to Workshop
          </a>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        </div>
      </div>

      {/* Questions */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        {loading ? (
          <div className="text-center py-12 text-indigo-600 animate-pulse">Loading questions…</div>
        ) : (
          <>
            {questions.map((q) => (
              <div key={q.projectQuestionId} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 answer-block">
                <h3 className="text-base font-semibold text-gray-900 mb-3">{q.prompt}</h3>
                <RichTextEditor
                  value={answers[q.projectQuestionId]?.html ?? ""}
                  placeholder="Write your answer here..."
                  onChange={({ html, delta }) =>
                    setAnswers((a) => ({
                      ...a,
                      [q.projectQuestionId]: { html, delta },
                    }))
                  }
                  className="rounded-md"
                />
              </div>
            ))}

            <div className="flex justify-end pt-2">
              <button
                onClick={handleExportPdf}
                disabled={isExporting}
                className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 font-semibold text-sm transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isExporting ? "Generating PDF…" : "Export & Submit PDF"}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
