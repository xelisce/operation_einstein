"use client";
import { useEffect } from "react";
import { useQuill } from "react-quilljs";
import "quill/dist/quill.snow.css";

type Props = {
  value?: string;
  onChange?: (payload: { html: string; delta: unknown }) => void;
  placeholder?: string;
  className?: string;
};

export default function RichTextEditor({
  value = "",
  onChange,
  placeholder = "Write your answer here...",
  className = "",
}: Props) {
  const { quill, quillRef } = useQuill({
    theme: "snow",
    placeholder,
    modules: {
      toolbar: true,
    },
  });

  useEffect(() => {
    if (!quill) return;

    const current = quill.root.innerHTML;
    const next = value || "";

    if (current !== next) {
      quill.clipboard.dangerouslyPasteHTML(next);
    }
  }, [quill, value]);

  useEffect(() => {
    if (!quill) return;

    const handler = () => {
      const html = quill.root.innerHTML;
      const delta = quill.getContents();
      onChange?.({ html, delta });
    };

    quill.on("text-change", handler);
    return () => {
      quill.off("text-change", handler);
    };
  }, [quill, onChange]);

  return (
    <div className={`w-full ${className}`}>
      <div ref={quillRef} className="min-h-[180px]" />
    </div>
  );
}
