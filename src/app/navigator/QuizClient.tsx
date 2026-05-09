"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { SECTOR_TO_INDUSTRY } from "@/lib/profile";
import type { Stage, Goal } from "@/lib/profile";

const STAGES: { value: Stage; label: string; sub: string }[] = [
  { value: "idea", label: "Idea", sub: "Haven't started yet" },
  { value: "building", label: "Building", sub: "Pre-revenue" },
  { value: "revenue", label: "Revenue", sub: "Paying customers" },
  { value: "growth", label: "Growing", sub: "Team & revenue" },
];

const SECTORS = Object.keys(SECTOR_TO_INDUSTRY);

const GOALS: { value: Goal; label: string; sub: string }[] = [
  { value: "Start a Business", label: "Start a Business", sub: "Launch guidance & basics" },
  { value: "Funding", label: "Funding", sub: "Grants, angels & VCs" },
  { value: "Mentorship", label: "Mentorship", sub: "Coaches & peer networks" },
  { value: "Workspace", label: "Workspace", sub: "Co-working & incubators" },
  { value: "International", label: "International", sub: "Export & trade support" },
  { value: "Scaling", label: "Scaling", sub: "Growth & expansion" },
];

const COMMUNITIES = [
  { value: "Veteran-owned", label: "Veteran-owned" },
  { value: "Woman-owned", label: "Woman-owned" },
  { value: "Rural business", label: "Rural business" },
  { value: "University student", label: "University / student" },
];

const STEP_LABELS = ["Stage", "Sector & City", "Goal", "Background"];

interface QuizState {
  stage: Stage | null;
  sector: string | null;
  city: string;
  goal: Goal | null;
  community: string[];
}

function OptionButton({
  selected,
  onClick,
  label,
  sub,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  sub?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full flex-col items-start rounded-xl border px-4 py-3.5 text-left transition-all",
        selected
          ? "border-accent bg-accent-soft text-ink shadow-sm"
          : "border-rule bg-surface-elev text-ink-soft hover:border-rule-strong hover:text-ink"
      )}
    >
      <span className="text-[14px] font-semibold leading-none">{label}</span>
      {sub && (
        <span className={cn("mt-1 text-[12px] leading-none", selected ? "text-ink-soft" : "text-ink-mute")}>
          {sub}
        </span>
      )}
    </button>
  );
}

function ToggleChip({
  selected,
  onClick,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-2 text-[13px] font-medium transition-all",
        selected
          ? "border-accent bg-accent-soft text-ink"
          : "border-rule bg-surface-elev text-ink-soft hover:border-rule-strong hover:text-ink"
      )}
    >
      {selected && <span className="mr-1.5">✓</span>}
      {label}
    </button>
  );
}

export function QuizClient() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [quiz, setQuiz] = useState<QuizState>({
    stage: null,
    sector: null,
    city: "",
    goal: null,
    community: [],
  });

  function canAdvance() {
    if (step === 0) return quiz.stage !== null;
    if (step === 1) return quiz.sector !== null && quiz.city.trim().length >= 2;
    if (step === 2) return quiz.goal !== null;
    return true; // step 3 is optional
  }

  function advance() {
    if (step < 3) {
      setStep((s) => s + 1);
    } else {
      submit();
    }
  }

  function submit() {
    if (!quiz.stage || !quiz.sector || !quiz.goal) return;
    sessionStorage.setItem(
      "sc_quiz",
      JSON.stringify({
        stage: quiz.stage,
        sector: quiz.sector,
        city: quiz.city.trim(),
        goal: quiz.goal,
        community: quiz.community,
      })
    );
    router.push("/results");
  }

  function toggleCommunity(value: string) {
    setQuiz((q) => ({
      ...q,
      community: q.community.includes(value)
        ? q.community.filter((c) => c !== value)
        : [...q.community, value],
    }));
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-12">
      {/* Step indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEP_LABELS.map((label, i) => (
            <div key={label} className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-semibold transition-colors",
                  i < step
                    ? "bg-accent text-[#fbf7f0]"
                    : i === step
                    ? "bg-ink text-[#fbf7f0]"
                    : "bg-rule text-ink-mute"
                )}
              >
                {i < step ? "✓" : i + 1}
              </div>
              <span className={cn("text-[11px] font-medium", i === step ? "text-ink" : "text-ink-mute")}>
                {label}
              </span>
            </div>
          ))}
        </div>
        <div className="relative mt-3 h-1 rounded-full bg-rule">
          <div
            className="absolute left-0 top-0 h-1 rounded-full bg-accent transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Step 0 — Stage */}
      {step === 0 && (
        <div>
          <h2 className="font-display text-2xl font-semibold text-ink">
            What stage is your business?
          </h2>
          <p className="mt-1.5 text-sm text-ink-mute">Select the one that best fits right now.</p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {STAGES.map((s) => (
              <OptionButton
                key={s.value}
                label={s.label}
                sub={s.sub}
                selected={quiz.stage === s.value}
                onClick={() => setQuiz((q) => ({ ...q, stage: s.value }))}
              />
            ))}
          </div>
        </div>
      )}

      {/* Step 1 — Sector + City */}
      {step === 1 && (
        <div>
          <h2 className="font-display text-2xl font-semibold text-ink">
            What sector and where?
          </h2>
          <p className="mt-1.5 text-sm text-ink-mute">Pick your industry and enter your city.</p>
          <div className="mt-6 grid grid-cols-2 gap-2">
            {SECTORS.map((s) => (
              <OptionButton
                key={s}
                label={s}
                selected={quiz.sector === s}
                onClick={() => setQuiz((q) => ({ ...q, sector: s }))}
              />
            ))}
          </div>
          <div className="mt-5">
            <label className="block text-[13px] font-medium text-ink-soft" htmlFor="city">
              Your city or county
            </label>
            <input
              id="city"
              type="text"
              placeholder="e.g. Salt Lake City, Provo, St. George…"
              value={quiz.city}
              onChange={(e) => setQuiz((q) => ({ ...q, city: e.target.value }))}
              className="mt-1.5 w-full rounded-xl border border-rule bg-surface-elev px-4 py-3 text-[14px] text-ink placeholder:text-ink-mute focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
        </div>
      )}

      {/* Step 2 — Goal */}
      {step === 2 && (
        <div>
          <h2 className="font-display text-2xl font-semibold text-ink">
            What are you looking for?
          </h2>
          <p className="mt-1.5 text-sm text-ink-mute">We&apos;ll match resources to your specific need.</p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {GOALS.map((g) => (
              <OptionButton
                key={g.value}
                label={g.label}
                sub={g.sub}
                selected={quiz.goal === g.value}
                onClick={() => setQuiz((q) => ({ ...q, goal: g.value }))}
              />
            ))}
          </div>
        </div>
      )}

      {/* Step 3 — Community (optional) */}
      {step === 3 && (
        <div>
          <h2 className="font-display text-2xl font-semibold text-ink">
            Do any of these describe you?
          </h2>
          <p className="mt-1.5 text-sm text-ink-mute">
            Optional — helps us surface community-specific programs.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {COMMUNITIES.map((c) => (
              <ToggleChip
                key={c.value}
                label={c.label}
                selected={quiz.community.includes(c.value)}
                onClick={() => toggleCommunity(c.value)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Nav */}
      <div className="mt-8 flex items-center justify-between">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="text-[13px] font-medium text-ink-mute hover:text-ink"
          >
            ← Back
          </button>
        ) : (
          <span />
        )}

        <button
          type="button"
          onClick={advance}
          disabled={!canAdvance()}
          className={cn(
            "inline-flex h-10 items-center gap-1.5 rounded-full px-6 text-[14px] font-semibold transition-all",
            canAdvance()
              ? "bg-ink text-[#fbf7f0] hover:bg-ink-soft"
              : "cursor-not-allowed bg-rule text-ink-mute"
          )}
        >
          {step === 3 ? "Find my resources →" : "Next →"}
        </button>
      </div>
    </div>
  );
}
