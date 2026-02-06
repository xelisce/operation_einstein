"use client";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function BackButton({ href }: { href?: string }) {
  const router = useRouter();

  const handleClick = () => {
    if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <button
      onClick={handleClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        border: "1px solid rgba(0,0,0,0.15)",
        borderRadius: 8,
        backgroundColor: "transparent",
        cursor: "pointer",
        fontSize: 14,
        fontWeight: 500,
      }}
    >
      <ArrowLeft size={18} />
      Back
    </button>
  );
}
