"use client";
import { useRouter } from "next/navigation";

export default function BackButton({ href, label = "Back" }: { href?: string; label?: string }) {
  const router = useRouter();

  const handleClick = () => {
    if (href) router.push(href);
    else router.back();
  };

  return (
    <button
      onClick={handleClick}
      className="text-sm text-indigo-600 hover:text-indigo-800 inline-block mb-2"
    >
      &larr; {label}
    </button>
  );
}
