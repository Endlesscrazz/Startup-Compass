"use client";

import { useState } from "react";
import type { EligibilityEstimate } from "@/lib/recommendation/types";

const STATUS_COPY: Record<
  EligibilityEstimate["status"],
  { label: string; className: string }
> = {
  likely_fit: {
    label: "Likely fit (estimated)",
    className: "border-emerald-200 bg-emerald-50 text-emerald-950",
  },
  maybe_fit: {
    label: "Maybe fit (estimated)",
    className: "border-amber-200 bg-amber-50 text-amber-950",
  },
  unlikely_fit: {
    label: "Unlikely fit (estimated)",
    className: "border-rule bg-surface-tint text-ink-soft",
  },
  not_enough_information: {
    label: "Not enough information",
    className: "border-rule bg-surface-tint text-ink-soft",
  },
};

export function ResourceFitChecker({ estimate }: { estimate: EligibilityEstimate }) {
  const [open, setOpen] = useState(false);
  const meta = STATUS_COPY[estimate.status];

  return (
    <div className="mt-3 rounded-lg border border-rule/80 bg-surface/80">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-3 py-2.5 text-left text-[13px] font-medium text-ink-soft hover:text-ink"
      >
        <span>Check my fit</span>
        <span className="text-ink-mute" aria-hidden="true">
          {open ? "▾" : "▸"}
        </span>
      </button>
      {open && (
        <div className="space-y-2 border-t border-rule/60 px-3 pb-3 pt-2">
          <p className="text-[11px] text-ink-mute">
            Estimated fit based on available information — not legal or official eligibility.
          </p>
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${meta.className}`}
          >
            {meta.label}
          </span>
          <ul className="list-disc space-y-1 pl-4 text-[12px] text-ink-soft">
            {estimate.reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
          {estimate.missingFields.length > 0 && (
            <p className="text-[11px] text-ink-mute">
              Add {estimate.missingFields.join(", ")} in your profile or quiz for a tighter estimate.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
