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

const TOOLBAR = [
  [{ header: [1, 2, 3, false] }],
  ["bold", "italic", "underline"],
  [{ list: "ordered" }, { list: "bullet" }],
  ["image"],
  ["clean"],
];

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

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
      toolbar: { container: TOOLBAR },
    },
  });

  // Override the image button with a file-picker handler
  useEffect(() => {
    if (!quill) return;

    const toolbar = quill.getModule("toolbar") as any;
    toolbar.addHandler("image", () => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.click();

      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) return;

        if (file.size > MAX_IMAGE_BYTES) {
          alert("Image is too large. Please choose an image under 5 MB.");
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target?.result as string;
          const range = quill.getSelection(true);
          quill.insertEmbed(range.index, "image", base64);
          quill.setSelection(range.index + 1, 0);
        };
        reader.readAsDataURL(file);
      };
    });
  }, [quill]);

  // Sync incoming value into editor
  useEffect(() => {
    if (!quill) return;
    const current = quill.root.innerHTML;
    const next = value || "";
    if (current !== next) {
      quill.clipboard.dangerouslyPasteHTML(next);
    }
  }, [quill, value]);

  // Emit changes upward
  useEffect(() => {
    if (!quill) return;
    const handler = () => {
      onChange?.({ html: quill.root.innerHTML, delta: quill.getContents() });
    };
    quill.on("text-change", handler);
    return () => { quill.off("text-change", handler); };
  }, [quill, onChange]);

  return (
    <div className={`w-full ${className}`}>
      <div ref={quillRef} className="min-h-[180px]" />
    </div>
  );
}
