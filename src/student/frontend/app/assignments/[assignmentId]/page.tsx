import { notFound } from "next/navigation";
import type { Assignment, Question, QuestionOption } from "../../models/types";
import SubmitAssignmentButton from "./submitAssignmentButton";

export const dynamic = "force-dynamic";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

async function getAssignment(assignmentId: string): Promise<Assignment> {
  const url = `${API_BASE}/api/assignments/${assignmentId}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch assignment: ${url} (${res.status}) ${text}`);
  }
  return res.json();
}

async function getQuestions(assignmentId: string): Promise<Question[]> {
  const url = `${API_BASE}/api/assignments/${assignmentId}/questions`;
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch questions: ${url} (${res.status}) ${text}`);
  }
  return res.json();
}

async function getQuestionOptions(questionId: string): Promise<QuestionOption[]> {
  const url = `${API_BASE}/api/questions/${questionId}/options`;
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch options: ${url} (${res.status}) ${text}`);
  }
  return res.json();
}

export default async function AssignmentPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const { assignmentId } = await params;
  if (!assignmentId || assignmentId === "undefined") notFound();

  const questionsRaw = await getQuestions(assignmentId);
  const questions = [...questionsRaw].sort(
    (a, b) => a.questionOrder - b.questionOrder
  );

  const mcqs = questions.filter((q) => q.type === "multiple_choice");
  const optionsPairs = await Promise.all(
    mcqs.map(async (q) => {
      const opts = await getQuestionOptions(q.questionId);
      const sorted = [...opts].sort((a, b) => a.optionOrder - b.optionOrder);
      return [q.questionId, sorted] as const;
    })
  );
  const optionsByQuestionId: Record<string, QuestionOption[]> = Object.fromEntries(optionsPairs);

  const assignment = await getAssignment(assignmentId);

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800 }}>{assignment.title}</h1>
      <div style={{ marginTop: 24, display: "grid", gap: 16 }}>
        {questions.map((q) => (
          <section
            key={q.questionId}
            style={{
              border: "1px solid rgba(0,0,0,0.12)",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <div style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
              <div style={{ fontWeight: 700 }}>
                Q{q.questionOrder}. {q.questionText}
              </div>
              <span style={{ fontSize: 12, opacity: 0.6 }}>{q.type}</span>
            </div>

            {q.type === "text" ? (
              <div style={{ marginTop: 12 }}>
                <textarea
                  name={`q_${q.questionId}`}
                  placeholder="Type your answer here..."
                  rows={4}
                  style={{
                    width: "100%",
                    border: "1px solid rgba(0,0,0,0.15)",
                    borderRadius: 10,
                    padding: 12,
                    fontSize: 14,
                  }}
                />
              </div>
            ) : (
              <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                {(optionsByQuestionId[q.questionId] ?? []).map((opt) => (
                  <label
                    key={opt.questionOptionId}
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "center",
                      border: "1px solid rgba(0,0,0,0.1)",
                      borderRadius: 10,
                      padding: "10px 12px",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name={`q_${q.questionId}`}
                      value={opt.questionOptionId}
                    />
                    <span>{opt.optionText}</span>
                  </label>
                ))}

                {(optionsByQuestionId[q.questionId] ?? []).length === 0 && (
                  <div style={{ opacity: 0.7 }}>No options found.</div>
                )}
              </div>
            )}
          </section>
        ))}
      </div>
      <SubmitAssignmentButton questions={questions} />
    </main>
  );
}
