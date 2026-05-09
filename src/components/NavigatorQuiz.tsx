"use client";

import { useMemo, useState } from "react";
import { ActionPlanPanel } from "@/components/founder/ActionPlanPanel";
import { FounderNextMoves } from "@/components/founder/FounderNextMoves";
import { FounderPathway } from "@/components/founder/FounderPathway";
import { OutreachDraftModal } from "@/components/founder/OutreachDraftModal";
import { ResourceRecommendationCard } from "@/components/founder/ResourceRecommendationCard";
import { buildFounderActionPlan } from "@/lib/founder/actionPlan";
import { deriveFounderPathway } from "@/lib/founder/pathway";
import { generateFounderMoves } from "@/lib/founder/founderMoves";
import { normalizeMatchResult } from "@/lib/founder/normalizeMatch";
import type { FounderProfileInput, MatchResultItem } from "@/lib/founder/types";
import type { Goal, Stage } from "@/lib/profile";
import { SECTOR_TO_INDUSTRY } from "@/lib/profile";

const STAGES: { value: Stage; label: string }[] = [
  { value: "idea", label: "Idea — exploring and validating" },
  { value: "building", label: "Building — early product or service" },
  { value: "revenue", label: "Revenue — paying customers" },
  { value: "growth", label: "Growth — scaling team and revenue" },
];

const GOALS: { value: Goal; label: string }[] = [
  { value: "Start a Business", label: "Start a business" },
  { value: "Funding", label: "Funding & capital" },
  { value: "Mentorship", label: "Mentorship & community" },
  { value: "Workspace", label: "Workspace & facilities" },
  { value: "International", label: "International trade" },
  { value: "Scaling", label: "Scaling operations" },
];

const SECTORS = Object.keys(SECTOR_TO_INDUSTRY) as (keyof typeof SECTOR_TO_INDUSTRY)[];

const COMMUNITY_OPTIONS = [
  { value: "Veteran-owned", label: "Veteran-owned" },
  { value: "Woman-owned", label: "Woman-owned" },
  { value: "Rural business", label: "Rural business" },
  { value: "University student", label: "University student" },
] as const;

export function NavigatorQuiz() {
  const [stage, setStage] = useState<Stage>("idea");
  const [sector, setSector] = useState<string>(SECTORS[0]!);
  const [city, setCity] = useState("");
  const [goal, setGoal] = useState<Goal>("Start a Business");
  const [community, setCommunity] = useState<string[]>([]);
  const [founderDisplayName, setFounderDisplayName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<MatchResultItem[] | null>(null);
  const [county, setCounty] = useState<string | null>(null);
  const [outreachForId, setOutreachForId] = useState<number | null>(null);

  const founderProfile: FounderProfileInput = useMemo(
    () => ({
      stage,
      sector,
      city: city.trim(),
      goal,
      community,
      founderDisplayName: founderDisplayName.trim() || undefined,
      businessName: businessName.trim() || undefined,
    }),
    [stage, sector, city, goal, community, founderDisplayName, businessName],
  );

  const pathwaySteps = useMemo(
    () =>
      results?.length
        ? deriveFounderPathway(founderProfile, results)
        : [],
    [founderProfile, results],
  );

  const founderMoves = useMemo(
    () =>
      results?.length ? generateFounderMoves(founderProfile, results) : [],
    [founderProfile, results],
  );

  const actionPlan = useMemo(() => {
    if (!results?.length) return null;
    return buildFounderActionPlan(
      founderProfile,
      results,
      founderMoves,
      { county },
    );
  }, [founderProfile, results, founderMoves, county]);

  const outreachResource = useMemo(() => {
    if (outreachForId == null || !results) return null;
    return results.find((r) => r.id === outreachForId) ?? null;
  }, [outreachForId, results]);

  const toggleCommunity = (label: string) => {
    setCommunity((prev) =>
      prev.includes(label)
        ? prev.filter((c) => c !== label)
        : [...prev, label],
    );
  };

  const submit = async () => {
    setError(null);
    setLoading(true);
    setResults(null);
    setCounty(null);
    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage,
          sector,
          city: city.trim(),
          goal,
          community,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          typeof data.error === "string"
            ? data.error
            : "Could not complete matching.",
        );
        return;
      }
      const raw = (data.results ?? []) as Partial<MatchResultItem>[];
      const normalized = raw
        .filter((r) => typeof r.id === "number")
        .map((r) => normalizeMatchResult(r as Partial<MatchResultItem> & { id: number }));
      setResults(normalized);
      setCounty(typeof data.county === "string" ? data.county : null);
    } catch {
      setError("Network error — try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="navigator-quiz mx-auto max-w-3xl">
      <header className="navigator-quiz-head mb-8">
        <p className="atlas-kicker text-[11px] uppercase tracking-[0.2em] text-accent">
          Founder navigator
        </p>
        <h1 className="font-display text-3xl font-semibold text-ink md:text-4xl">
          Match Utah programs to your profile
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
          Semantic retrieval with Utah county rules — then short explanations.
        </p>
      </header>

      <div className="navigator-quiz-grid grid gap-5 rounded-[14px] border border-rule bg-surface-elev p-6 shadow-[var(--shadow-card)]">
        <label className="flex flex-col gap-2">
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-mute">
            Your name (optional)
          </span>
          <input
            className="rounded-lg border border-rule bg-surface px-3 py-2.5 text-[14px] text-ink placeholder:text-ink-mute"
            placeholder="Used for outreach drafts only"
            value={founderDisplayName}
            onChange={(e) => setFounderDisplayName(e.target.value)}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-mute">
            Business name (optional)
          </span>
          <input
            className="rounded-lg border border-rule bg-surface px-3 py-2.5 text-[14px] text-ink placeholder:text-ink-mute"
            placeholder="Used for outreach drafts only"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-mute">
            Stage
          </span>
          <select
            className="rounded-lg border border-rule bg-surface px-3 py-2.5 text-[14px] text-ink"
            value={stage}
            onChange={(e) => setStage(e.target.value as Stage)}
          >
            {STAGES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-mute">
            Sector
          </span>
          <select
            className="rounded-lg border border-rule bg-surface px-3 py-2.5 text-[14px] text-ink"
            value={sector}
            onChange={(e) => setSector(e.target.value)}
          >
            {SECTORS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-mute">
            City or county in Utah
          </span>
          <input
            className="rounded-lg border border-rule bg-surface px-3 py-2.5 text-[14px] text-ink placeholder:text-ink-mute"
            placeholder="e.g. Salt Lake City or Utah County"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-mute">
            Primary goal
          </span>
          <select
            className="rounded-lg border border-rule bg-surface px-3 py-2.5 text-[14px] text-ink"
            value={goal}
            onChange={(e) => setGoal(e.target.value as Goal)}
          >
            {GOALS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="flex flex-col gap-3 border-0 p-0">
          <legend className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-mute">
            Community tags (optional)
          </legend>
          <div className="flex flex-wrap gap-3">
            {COMMUNITY_OPTIONS.map((c) => (
              <label
                key={c.value}
                className="inline-flex cursor-pointer items-center gap-2 text-[13px] text-ink-soft"
              >
                <input
                  type="checkbox"
                  checked={community.includes(c.value)}
                  onChange={() => toggleCommunity(c.value)}
                  className="rounded border-rule text-accent focus:ring-accent"
                />
                {c.label}
              </label>
            ))}
          </div>
        </fieldset>

        <button
          type="button"
          className="atlas-btn atlas-btn-primary justify-center"
          disabled={loading || !city.trim()}
          onClick={() => void submit()}
        >
          {loading ? "Matching…" : "Find resources"}
        </button>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-900">
            {error}
          </p>
        )}
      </div>

      {results && results.length > 0 && (
        <section className="mt-12 space-y-10" aria-live="polite">
          <div>
            <h2 className="font-display text-2xl font-semibold text-ink">
              Your pathway
            </h2>
            {pathwaySteps.length > 0 && (
              <div className="mt-4">
                <FounderPathway steps={pathwaySteps} />
              </div>
            )}
          </div>

          <FounderNextMoves moves={founderMoves} />

          {actionPlan && <ActionPlanPanel plan={actionPlan} />}

          <div>
            <h2 className="font-display text-2xl font-semibold text-ink">
              Top matches
            </h2>
            {county && (
              <p className="mt-2 text-[13px] text-ink-mute">
                County eligibility resolved to <strong>{county}</strong>.
              </p>
            )}
            <ul className="mt-6 flex flex-col gap-5">
              {results.map((r) => (
                <ResourceRecommendationCard
                  key={r.id}
                  founderProfile={founderProfile}
                  resource={r}
                  county={county}
                  onDraftOutreach={() => setOutreachForId(r.id)}
                />
              ))}
            </ul>
          </div>
        </section>
      )}

      <OutreachDraftModal
        open={outreachForId != null}
        onClose={() => setOutreachForId(null)}
        founderProfile={founderProfile}
        resource={outreachResource}
      />
    </div>
  );
}
