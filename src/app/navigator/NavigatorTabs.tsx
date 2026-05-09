"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { QuizClient } from "./QuizClient";
import { NLClient } from "./NLClient";

type Tab = "quiz" | "nl";

export function NavigatorTabs() {
  const [tab, setTab] = useState<Tab>("quiz");

  return (
    <div>
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
