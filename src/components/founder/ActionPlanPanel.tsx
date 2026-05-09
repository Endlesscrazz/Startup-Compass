"use client";

import { useState } from "react";
import type { FounderActionPlan } from "@/lib/founder/types";
import {
  formatActionPlanAsJson,
  formatActionPlanAsText,
} from "@/lib/founder/actionPlan";

export function ActionPlanPanel({ plan }: { plan: FounderActionPlan }) {
  const [copied, setCopied] = useState(false);

  const copyText = async () => {
    const body = formatActionPlanAsText(plan);
    try {
      await navigator.clipboard.writeText(body);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const downloadTxt = () => {
    const blob = new Blob([formatActionPlanAsText(plan)], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `startup-compass-action-plan-${plan.generatedAt.slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadJson = () => {
    const blob = new Blob([formatActionPlanAsJson(plan)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `startup-compass-action-plan-${plan.generatedAt.slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="action-plan-panel rounded-[14px] border border-dashed border-rule bg-surface-elev/80 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-mute">
            Action plan
          </p>
          <p className="text-[13px] text-ink-soft">
            Save everything you see — profile, matches, and Next 3 Moves.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-full border border-rule bg-surface px-3 py-1.5 text-[12px] font-medium text-ink hover:border-accent"
            onClick={() => void copyText()}
          >
            {copied ? "Copied" : "Copy to clipboard"}
          </button>
          <button
            type="button"
            className="rounded-full border border-rule bg-surface px-3 py-1.5 text-[12px] font-medium text-ink hover:border-accent"
            onClick={downloadTxt}
          >
            Download .txt
          </button>
          <button
            type="button"
            className="rounded-full border border-rule bg-surface px-3 py-1.5 text-[12px] font-medium text-ink hover:border-accent"
            onClick={downloadJson}
          >
            Download .json
          </button>
        </div>
      </div>
    </div>
  );
}
