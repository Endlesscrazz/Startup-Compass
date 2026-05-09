"use client";

import { useState } from "react";

const FOUNDER_NEED_OPTIONS = [
  { id: "seed-investor", label: "Seed Investors", emoji: "💰" },
  { id: "engineer", label: "Hiring Engineers", emoji: "⚙️" },
  { id: "designer", label: "Hiring Designers", emoji: "🎨" },
  { id: "legal", label: "Legal Support", emoji: "⚖️" },
  { id: "interns", label: "University Interns", emoji: "🎓" },
  { id: "office-space", label: "Office Space", emoji: "🏢" },
  { id: "pilot-customers", label: "Pilot Customers", emoji: "🧪" },
  { id: "manufacturing", label: "Manufacturing Partner", emoji: "🏭" },
  { id: "export", label: "Export Support", emoji: "🌍" },
  { id: "mentor", label: "Mentor / Advisor", emoji: "🧭" },
  { id: "grant", label: "Grant Funding", emoji: "📋" },
  { id: "series-a", label: "Series A Investors", emoji: "📈" },
] as const;

export type FounderNeedId = (typeof FOUNDER_NEED_OPTIONS)[number]["id"];

type Props = {
  /** Currently selected need IDs */
  selected: string[];
  onChange: (needs: string[]) => void;
  readonly?: boolean;
};

export function FounderNeedsPanel({ selected, onChange, readonly = false }: Props) {
  const toggle = (id: string) => {
    if (readonly) return;
    if (selected.includes(id)) {
      onChange(selected.filter((n) => n !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-mute">
        {readonly ? "What they need" : "What do you need?"}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {FOUNDER_NEED_OPTIONS.map((opt) => {
          const active = selected.includes(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              disabled={readonly}
              onClick={() => toggle(opt.id)}
              aria-pressed={active}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition-colors ${
                active
                  ? "border-gold bg-gold-soft text-ink"
                  : readonly
                  ? "border-rule bg-surface text-ink-mute cursor-default"
                  : "border-rule bg-surface text-ink-soft hover:border-gold hover:text-ink"
              }`}
            >
              <span aria-hidden="true">{opt.emoji}</span>
              {opt.label}
            </button>
          );
        })}
      </div>
      {!readonly && selected.length === 0 && (
        <p className="mt-2 text-[11px] text-ink-mute">
          Select what you&apos;re currently looking for — this helps the community find and connect with you.
        </p>
      )}
    </div>
  );
}
