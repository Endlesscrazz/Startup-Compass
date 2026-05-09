import { cn } from "@/lib/utils";

const TOPIC_COLORS: Record<string, string> = {
  "Funding": "bg-amber-50 text-amber-800 border-amber-200",
  "Start a Business": "bg-emerald-50 text-emerald-800 border-emerald-200",
  "Late Stage Growth": "bg-blue-50 text-blue-800 border-blue-200",
  "International Trade": "bg-indigo-50 text-indigo-800 border-indigo-200",
  "Entrepreneurship Communities": "bg-purple-50 text-purple-800 border-purple-200",
  "Other": "bg-surface-tint text-ink-mute border-rule",
};

const COMMUNITY_COLORS: Record<string, string> = {
  "Veteran": "bg-red-50 text-red-800 border-red-200",
  "Women": "bg-pink-50 text-pink-800 border-pink-200",
  "Rural": "bg-lime-50 text-lime-800 border-lime-200",
  "Student": "bg-cyan-50 text-cyan-800 border-cyan-200",
  "Any": "bg-surface-tint text-ink-mute border-rule",
};

interface CategoryBadgeProps {
  label: string;
  type?: "topic" | "community";
  className?: string;
}

export function CategoryBadge({ label, type = "topic", className }: CategoryBadgeProps) {
  const colorMap = type === "community" ? COMMUNITY_COLORS : TOPIC_COLORS;
  const colors = colorMap[label] ?? "bg-surface-tint text-ink-mute border-rule";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium leading-none",
        colors,
        className
      )}
    >
      {label}
    </span>
  );
}
