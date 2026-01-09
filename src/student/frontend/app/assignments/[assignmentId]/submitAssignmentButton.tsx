"use client";
import type { Question } from "../../models/types";

export default function SubmitAssignmentButton({ questions } : { questions: Question[] }) {
    function handleSubmit() {
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

        if (allAnswered) {
            alert("Assignment submitted!");
        } else {
            alert("Please answer all questions.");
        }
    }

    return (
    <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
        <button
        type="button"
        onClick={handleSubmit}
        style={{
            cursor: "pointer",
        }}
        >
        Submit Assignment
        </button>
    </div>
    );
}
