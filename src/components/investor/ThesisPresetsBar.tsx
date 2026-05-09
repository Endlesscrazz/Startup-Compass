"use client";

import type { ThesisPreset } from "@/lib/investor/thesisPresets";

export function ThesisPresetsBar({
  presets,
  onApply,
}: {
  presets: ThesisPreset[];
  onApply: (preset: ThesisPreset) => void;
}) {
  if (presets.length === 0) return null;
  return (
    <div className="thesis-presets border-t border-rule/50 bg-surface-tint/20 px-3 py-2">
      <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-mute">
        Explore by thesis
      </p>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5">
        {presets.map((p) => (
          <button
            key={p.id}
            type="button"
            title={p.description}
            className="shrink-0 rounded-full border border-rule bg-surface-elev px-3 py-1 text-[11px] font-medium text-ink-soft hover:border-accent hover:text-ink"
            onClick={() => onApply(p)}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
