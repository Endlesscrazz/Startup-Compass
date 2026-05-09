"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { QuizClient } from "./QuizClient";
import { NLClient } from "./NLClient";

const STORAGE_SAVE_KEY = "sc_saved_results";

function readSavedResults() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const stored = parsed.stored;
    const label = stored?.description
      ? stored.description.slice(0, 55) + "…"
      : [stored?.stage, stored?.sector, stored?.goal].filter(Boolean).join(" · ");
    return { county: parsed.county, savedAt: parsed.savedAt, label };
  } catch {
    return null;
  }
}

function SavedResultsBanner() {
  const router = useRouter();
  const [saved, setSaved] = useState<{ county: string; savedAt: number; label: string } | null>(() =>
    readSavedResults(),
  );
  const [now] = useState(() => Date.now());

  if (!saved) return null;

  const daysAgo = Math.floor((now - saved.savedAt) / 86400000);
  const timeLabel = daysAgo === 0 ? "today" : daysAgo === 1 ? "yesterday" : `${daysAgo} days ago`;

  function handleResume() {
    try {
      const raw = localStorage.getItem(STORAGE_SAVE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      sessionStorage.setItem("sc_quiz", JSON.stringify(parsed.stored));
      router.push("/results");
    } catch { /* ignore */ }
  }

  function handleDismiss() {
    localStorage.removeItem(STORAGE_SAVE_KEY);
    setSaved(null);
  }

  return (
    <div className="mx-auto max-w-xl px-4 pt-4">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-rule/60 bg-surface-tint/60 px-4 py-3">
        <div className="min-w-0">
          <p className="text-[12px] font-medium text-ink-soft truncate">
            Saved search from {timeLabel} · {saved.county} County
          </p>
          <p className="mt-0.5 text-[11px] text-ink-mute truncate">{saved.label}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={handleResume}
            className="inline-flex h-7 items-center rounded-full bg-ink px-3 text-[12px] font-medium text-[#fbf7f0] hover:bg-ink-soft">
            Resume →
          </button>
          <button type="button" onClick={handleDismiss}
            className="text-ink-mute hover:text-ink text-[18px] leading-none">
            ×
          </button>
        </div>
      </div>
    </div>
  );
}

type Tab = "quiz" | "nl";

export function NavigatorTabs() {
  const [tab, setTab] = useState<Tab>("quiz");

  return (
    <div>
      <SavedResultsBanner />
      {/* Tab toggle */}
      <div className="border-b border-rule">
        <div className="mx-auto flex max-w-xl gap-0 px-4">
          {(["quiz", "nl"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 py-3 text-[13px] font-medium transition-colors",
                tab === t
                  ? "border-b-2 border-accent text-ink"
                  : "text-ink-mute hover:text-ink"
              )}
            >
              {t === "quiz" ? "Step-by-step quiz" : "Describe your situation"}
            </button>
          ))}
        </div>
      </div>

      {tab === "quiz" ? <QuizClient /> : <NLClient />}
    </div>
  );
}
