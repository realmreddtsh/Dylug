import { MessageCircle } from "lucide-react";

export default function BrandMark({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = {
    sm: "h-8 w-8 rounded-[10px]",
    md: "h-11 w-11 rounded-[14px]",
    lg: "h-16 w-16 rounded-[20px]",
  };
  const icons = { sm: 17, md: 23, lg: 32 };

  return (
    <span
      className={`brand-mark inline-flex shrink-0 items-center justify-center bg-disc-brand text-white shadow-lg shadow-indigo-950/20 ${sizes[size]} ${className}`}
      aria-hidden="true"
    >
      <MessageCircle size={icons[size]} strokeWidth={2.7} fill="currentColor" />
      <span className="brand-mark-eyes" />
    </span>
  );
}
