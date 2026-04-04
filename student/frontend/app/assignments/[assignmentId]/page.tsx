import { notFound } from "next/navigation";
import Link from "next/link";
import type { Assignment, Question, QuestionOption } from "../../models/types";
import SubmitAssignmentButton from "./submitAssignmentButton";

export const dynamic = "force-dynamic";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

async function getAssignment(assignmentId: string): Promise<Assignment> {
  const res = await fetch(`${API_BASE}/api/assignments/${assignmentId}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch assignment (${res.status})`);
  return res.json();
}

async function getQuestions(assignmentId: string): Promise<Question[]> {
  const res = await fetch(`${API_BASE}/api/assignments/${assignmentId}/questions`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch questions (${res.status})`);
  return res.json();
}

async function getQuestionOptions(questionId: string): Promise<QuestionOption[]> {
  const res = await fetch(`${API_BASE}/api/questions/${questionId}/options`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch options (${res.status})`);
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
  const questions = [...questionsRaw].sort((a, b) => a.questionOrder - b.questionOrder);

  const mcqs = questions.filter((q) => q.type === "multiple_choice");
  const optionsPairs = await Promise.all(
    mcqs.map(async (q) => {
      const opts = await getQuestionOptions(q.questionId);
      return [q.questionId, [...opts].sort((a, b) => a.optionOrder - b.optionOrder)] as const;
    })
  );
  const optionsByQuestionId: Record<string, QuestionOption[]> = Object.fromEntries(optionsPairs);

  const assignment = await getAssignment(assignmentId);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href={`/workshops/${assignment.workshopId}`}
            className="text-sm text-indigo-600 hover:text-indigo-800 mb-2 inline-block"
          >
            &larr; Back to Workshop
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{assignment.title}</h1>
          {assignment.points > 0 && (
            <p className="text-gray-500 mt-1">{assignment.points} points</p>
          )}
        </div>
      </div>

      {/* Questions */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        {questions.map((q) => (
          <div
            key={q.questionId}
            className="bg-white rounded-lg shadow-sm border border-gray-100 p-6"
          >
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                Q{q.questionOrder}
              </span>
              <p className="font-semibold text-gray-900">{q.questionText}</p>
            </div>

            {q.type === "text" ? (
              <textarea
                name={`q_${q.questionId}`}
                placeholder="Type your answer here..."
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 outline-none resize-none"
              />
            ) : (
              <div className="space-y-2">
                {(optionsByQuestionId[q.questionId] ?? []).map((opt) => (
                  <label
                    key={opt.questionOptionId}
                    className="flex items-center gap-3 border border-gray-200 rounded-lg px-4 py-3 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50 transition"
                  >
                    <input
                      type="radio"
                      name={`q_${q.questionId}`}
                      value={opt.optionText}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-800">{opt.optionText}</span>
                  </label>
                ))}
                {(optionsByQuestionId[q.questionId] ?? []).length === 0 && (
                  <p className="text-sm text-gray-400">No options found.</p>
                )}
              </div>
            )}
          </div>
        ))}

        <div className="flex justify-end pt-2">
          <SubmitAssignmentButton
            questions={questions}
            workshopId={assignment.workshopId}
            assignmentId={assignmentId}
          />
        </div>
      </main>
    </div>
  );
}
