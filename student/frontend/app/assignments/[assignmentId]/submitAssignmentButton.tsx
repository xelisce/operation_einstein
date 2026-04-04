"use client";
import { useRouter } from "next/navigation";
import type { Question } from "../../models/types";
import { useAuth } from "../../useAuth";
import { authFetch } from "../../lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function SubmitAssignmentButton({ questions, workshopId, assignmentId }: { questions: Question[]; workshopId: string; assignmentId: string }) {
    const router = useRouter();
    const { user } = useAuth();

    async function handleSubmit() {
        const allAnswered = questions.every((q) => {
            const name = `q_${q.questionId}`;
            if (q.type === "text") {
                const textarea = document.querySelector(`textarea[name="${name}"]`) as HTMLTextAreaElement | null;
                return !!textarea && textarea.value.trim().length > 0;
            }

            if (q.type === "multiple_choice") {
                const checked = document.querySelector(`input[type="radio"][name="${name}"]:checked`);
                return !!checked;
            }
        });

        if (!allAnswered) {
            alert("Please answer all questions.");
            return;
        }

        if (!user?.id) {
            alert("You must be logged in to submit.");
            return;
        }

        const responses = questions.map((q) => {
            const name = `q_${q.questionId}`;
            let answerText = "";

            if (q.type === "text") {
                const textarea = document.querySelector(`textarea[name="${name}"]`) as HTMLTextAreaElement | null;
                answerText = textarea?.value.trim() ?? "";
            } else if (q.type === "multiple_choice") {
                const checked = document.querySelector(`input[type="radio"][name="${name}"]:checked`) as HTMLInputElement | null;
                answerText = checked?.value ?? "";
            }

            return {
                questionId: q.questionId,
                answerText,
            };
        });

        try {
            const res = await authFetch(`${API_BASE}/api/assignments/${assignmentId}/responses`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ responses }),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Failed to submit assignment: ${text}`);
            }

            alert("Assignment submitted successfully!");
            router.push(`/workshops/${workshopId}`);
        } catch (error) {
            console.error(error);
            alert(`Error submitting assignment: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }

    return (
        <button
            type="button"
            onClick={handleSubmit}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 font-semibold text-sm transition-colors shadow-sm"
        >
            Submit Assignment
        </button>
    );
}
