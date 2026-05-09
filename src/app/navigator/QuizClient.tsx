"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { SECTOR_TO_INDUSTRY } from "@/lib/profile";
import type { Stage, Goal } from "@/lib/profile";

/** Distinct UI stages; multiple keys may map to the same API `Stage`. */
const STAGE_OPTIONS: { key: string; api: Stage; label: string; sub: string }[] = [
  { key: "idea", api: "idea", label: "Idea", sub: "Haven't started yet" },
  { key: "pre-seed", api: "building", label: "Pre-seed", sub: "Early product, pre-revenue" },
  { key: "seed", api: "building", label: "Seed", sub: "Traction or seed fundraising" },
  { key: "revenue", api: "revenue", label: "Growth", sub: "Paying customers" },
  { key: "scaling", api: "growth", label: "Scaling", sub: "Team & revenue expansion" },
  { key: "unsure", api: "idea", label: "Unsure", sub: "Not sure yet" },
];

const SECTORS = Object.keys(SECTOR_TO_INDUSTRY);

const GOAL_OPTIONS: { id: string; value: Goal; label: string; sub: string }[] = [
  { id: "validate", value: "Start a Business", label: "Validate an idea", sub: "Test and refine your concept" },
  { id: "learn-basics", value: "Start a Business", label: "Learn startup basics", sub: "Founder 101 & launch guidance" },
  { id: "funding", value: "Funding", label: "Find funding", sub: "Grants, angels, venture" },
  { id: "grants", value: "Funding", label: "Apply for grants", sub: "Non-dilutive and competitions" },
  { id: "investors", value: "Funding", label: "Meet investors", sub: "Pitch and relationship building" },
  { id: "hire", value: "Scaling", label: "Hire talent", sub: "Growing the team" },
  { id: "mentors", value: "Mentorship", label: "Find mentors", sub: "Coaching & advice" },
  { id: "accelerator", value: "Mentorship", label: "Join an accelerator", sub: "Structured programs" },
  { id: "events", value: "Mentorship", label: "Attend events", sub: "Community & networking" },
  { id: "space", value: "Workspace", label: "Find office / lab space", sub: "Facilities & incubators" },
  { id: "international", value: "International", label: "International trade", sub: "Export & global markets" },
  { id: "scale-ops", value: "Scaling", label: "Scale operations", sub: "Systems & expansion" },
];

const COMMUNITIES = [
  { value: "Veteran-owned", label: "Veteran-owned" },
  { value: "Woman-owned", label: "Woman-owned" },
  { value: "Rural business", label: "Rural business" },
  { value: "University student", label: "University / student" },
];

const STEP_LABELS = ["Stage", "Sector & City", "Goal", "Background"];

const LOC_PREFS_KEY = "sc_location_prefs";

interface QuizState {
  stageKey: string | null;
  sector: string | null;
  city: string;
  goalId: string | null;
  community: string[];
  founderName: string;
  statewideBoost: boolean;
  remotePrefer: boolean;
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
          ? "border-gold bg-gold-soft text-ink shadow-sm"
          : "border-rule bg-surface-elev text-ink-soft hover:border-rule-strong hover:text-ink",
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
          ? "border-gold bg-gold-soft text-ink"
          : "border-rule bg-surface-elev text-ink-soft hover:border-rule-strong hover:text-ink",
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
    stageKey: null,
    sector: null,
    city: "",
    goalId: null,
    community: [],
    founderName: "",
    statewideBoost: false,
    remotePrefer: false,
  });

  function canAdvance() {
    if (step === 0) return quiz.stageKey !== null;
    if (step === 1) return quiz.sector !== null && quiz.city.trim().length >= 2;
    if (step === 2) return quiz.goalId !== null;
    return true;
  }

  function advance() {
    if (step < 3) {
      setStep((s) => s + 1);
    } else {
      submit();
    }
  }

  function submit() {
    const stageOpt = STAGE_OPTIONS.find((s) => s.key === quiz.stageKey);
    const goalOpt = GOAL_OPTIONS.find((g) => g.id === quiz.goalId);
    if (!stageOpt || !quiz.sector || !goalOpt) return;
    try {
      sessionStorage.setItem(
        LOC_PREFS_KEY,
        JSON.stringify({
          statewideBoost: quiz.statewideBoost,
          remotePrefer: quiz.remotePrefer,
        }),
      );
    } catch {
      /* ignore */
    }
    const payload: Record<string, unknown> = {
      stage: stageOpt.api,
      sector: quiz.sector,
      city: quiz.city.trim(),
      goal: goalOpt.value,
      community: quiz.community,
    };
    if (quiz.founderName.trim()) payload.founderName = quiz.founderName.trim();
    sessionStorage.setItem("sc_quiz", JSON.stringify(payload));
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
                    ? "bg-utah-blue text-white"
                    : i === step
                      ? "bg-ink text-white"
                      : "bg-rule text-ink-mute",
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
            className="absolute left-0 top-0 h-1 rounded-full bg-gold transition-all duration-300"
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
            {STAGE_OPTIONS.map((s) => (
              <OptionButton
                key={s.key}
                label={s.label}
                sub={s.sub}
                selected={quiz.stageKey === s.key}
                onClick={() => setQuiz((q) => ({ ...q, stageKey: s.key }))}
              />
            ))}
          </div>
        </div>
      )}

      {/* Step 1 — Sector + City + location prefs */}
      {step === 1 && (
        <div>
          <h2 className="font-display text-2xl font-semibold text-ink">
            What sector and where?
          </h2>
          <p className="mt-1.5 text-sm text-ink-mute">Pick your industry and enter your city or county.</p>
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
              Your city or county in Utah
            </label>
            <input
              id="city"
              type="text"
              placeholder="e.g. Salt Lake City, Provo, St. George…"
              value={quiz.city}
              onChange={(e) => setQuiz((q) => ({ ...q, city: e.target.value }))}
              className="mt-1.5 w-full rounded-xl border border-rule bg-surface-elev px-4 py-3 text-[14px] text-ink placeholder:text-ink-mute focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
            />
          </div>
          <div className="mt-4 space-y-2 rounded-xl border border-rule/60 bg-surface-tint/30 px-4 py-3">
            <p className="text-[12px] font-medium text-ink-soft">How should we prioritize results?</p>
            <label className="flex cursor-pointer items-center gap-2 text-[13px] text-ink-soft">
              <input
                type="checkbox"
                checked={quiz.statewideBoost}
                onChange={(e) => setQuiz((q) => ({ ...q, statewideBoost: e.target.checked }))}
                className="rounded border-rule accent-gold"
              />
              Prefer statewide programs first
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-[13px] text-ink-soft">
              <input
                type="checkbox"
                checked={quiz.remotePrefer}
                onChange={(e) => setQuiz((q) => ({ ...q, remotePrefer: e.target.checked }))}
                className="rounded border-rule accent-gold"
              />
              Emphasize remote / online-friendly programs
            </label>
            <p className="text-[11px] text-ink-mute">
              Optional — on your results page, use the <strong>Quick-match order</strong> tab when these
              are on.
            </p>
          </div>
        </div>
      )}

      {/* Step 2 — Goal */}
      {step === 2 && (
        <div>
          <h2 className="font-display text-2xl font-semibold text-ink">
            What are you trying to do right now?
          </h2>
          <p className="mt-1.5 text-sm text-ink-mute">
            We&apos;ll match resources to your need (same 5–7 ranked results as before).
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {GOAL_OPTIONS.map((g) => (
              <OptionButton
                key={g.id}
                label={g.label}
                sub={g.sub}
                selected={quiz.goalId === g.id}
                onClick={() => setQuiz((q) => ({ ...q, goalId: g.id }))}
              />
            ))}
          </div>
        </div>
      )}

      {/* Step 3 — Community + optional name */}
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
          <div className="mt-6">
            <label className="block text-[13px] font-medium text-ink-soft" htmlFor="founder-name">
              Your first name <span className="text-ink-mute font-normal">(optional — used for email drafts)</span>
            </label>
            <input
              id="founder-name"
              type="text"
              placeholder="e.g. Sarah"
              maxLength={50}
              value={quiz.founderName}
              onChange={(e) => setQuiz((q) => ({ ...q, founderName: e.target.value }))}
              className="mt-1.5 w-full rounded-xl border border-rule bg-surface-elev px-4 py-3 text-[14px] text-ink placeholder:text-ink-mute focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
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
              ? "border-2 border-gold bg-utah-blue text-white hover:bg-utah-blue-hover"
              : "cursor-not-allowed bg-rule text-ink-mute",
          )}
        >
          {step === 3 ? "Find my resources →" : "Next →"}
        </button>
      </div>
    </div>
  );
}
