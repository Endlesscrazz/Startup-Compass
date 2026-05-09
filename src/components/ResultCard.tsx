"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CategoryBadge } from "@/components/CategoryBadge";
import { OutreachDraftModal } from "@/components/founder/OutreachDraftModal";
import { JargonText } from "@/components/JargonText";
import { ResourceFitChecker } from "@/components/results/ResourceFitChecker";
import type { MatchResultItem } from "@/app/api/match/route";
import type { FounderProfileInput, MatchResultItem as FounderMatchResultItem } from "@/lib/founder/types";
import {
  estimateEligibility,
  scoreResourceRecommendation,
} from "@/lib/recommendation/scoreResource";
import {
  inferResourceTypeLabel,
  locationSummary,
  remoteMentioned,
} from "@/lib/recommendation/resourceMetadata";

interface ResultCardProps {
  result: MatchResultItem;
  rank: number;
  founderProfile?: FounderProfileInput | null;
  county?: string | null;
}

export function ResultCard({ result, rank, founderProfile, county }: ResultCardProps) {
  const router = useRouter();
  const { title, explanation, description, link, email, topics, communities } = result;
  const [modalOpen, setModalOpen] = useState(false);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [similarError, setSimilarError] = useState(false);

  const visibleCommunities = communities.filter((c) => c !== "Any");

  const isFallback =
    explanation.endsWith("…") && description.startsWith(explanation.slice(0, -1).trimEnd());

  async function handleFindSimilar() {
    setSimilarLoading(true);
    setSimilarError(false);
    try {
      const res = await fetch("/api/match/similar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceId: result.id, city: county ?? "" }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as {
        sourceTitle: string;
        results: MatchResultItem[];
        county: string;
      };
      // Preserve original quiz so "← Back to your matches" can restore it
      const original = sessionStorage.getItem("sc_quiz");
      if (original) sessionStorage.setItem("sc_quiz_prev", original);
      sessionStorage.setItem(
        "sc_quiz",
        JSON.stringify({
          _similar: true,
          sourceTitle: data.sourceTitle,
          results: data.results,
          county: data.county,
        }),
      );
      router.push("/results?t=" + Date.now());
    } catch {
      setSimilarError(true);
      setTimeout(() => setSimilarError(false), 2000);
    } finally {
      setSimilarLoading(false);
    }
  }

  const rec =
    founderProfile != null
      ? scoreResourceRecommendation(founderProfile, result, { county })
      : null;
  const eligibility =
    founderProfile != null ? estimateEligibility(founderProfile, result, { county }) : null;

  const typeLabel = inferResourceTypeLabel(result);
  const locLine = locationSummary(result, county);
  const remote = remoteMentioned(result);

  const confidenceLabel =
    rec?.confidence === "high"
      ? "Strong match"
      : rec?.confidence === "medium"
        ? "Medium match"
        : rec
          ? "Exploratory match"
          : null;

  const resourceForModal = result as unknown as FounderMatchResultItem;

  return (
    <>
      <article className="group relative rounded-[14px] border border-rule bg-surface-elev p-6 shadow-card transition-shadow hover:shadow-card-hover">
        <div className="flex items-start gap-4">
          <span
            className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-gold bg-utah-blue text-[12px] font-bold text-white"
            aria-label={`Result ${rank}`}
          >
            {rank}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="font-display text-[17px] font-semibold leading-snug text-ink">
                <JargonText text={title} />
              </h3>
              {rec && (
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="rounded-full bg-surface-tint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-mute">
                    {confidenceLabel}
                  </span>
                  <span className="text-[11px] text-ink-mute">Score · {rec.score}</span>
                </div>
              )}
            </div>

            {typeLabel && (
              <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-ink-mute">
                {typeLabel}
              </p>
            )}

            {(topics.length > 0 || visibleCommunities.length > 0) && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {topics.map((t) => (
                  <CategoryBadge key={t} label={t} type="topic" />
                ))}
                {visibleCommunities.map((c) => (
                  <CategoryBadge key={c} label={c} type="community" />
                ))}
              </div>
            )}

            <dl className="mt-3 grid gap-1.5 text-[12px] text-ink-soft sm:grid-cols-2">
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-ink-mute">
                  Location / access
                </dt>
                <dd>
                  {locLine}
                  {remote ? " · Remote / online mentioned" : ""}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-ink-mute">
                  Stage &amp; goal fit
                </dt>
                <dd>
                  {founderProfile
                    ? `Your stage (${founderProfile.stage}) · goal (${founderProfile.goal})`
                    : "Complete the quiz to see stage and goal fit."}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-ink-mute">
                  Deadline
                </dt>
                <dd className="text-ink-mute">Not listed in dataset</dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-ink-mute">
                  Application effort
                </dt>
                <dd className="text-ink-mute">Not listed yet</dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-ink-mute">
                  Last verified
                </dt>
                <dd className="text-ink-mute">Not tracked per resource</dd>
              </div>
            </dl>

            {rec && rec.reasons.length > 0 && (
              <div className="mt-3 rounded-lg bg-surface-tint/60 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-mute">
                  Why this matched
                </p>
                <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-[12px] text-ink-soft">
                  {rec.reasons.slice(0, 4).map((r, i) => (
                    <li key={i}>
                      <JargonText text={r} />
                    </li>
                  ))}
                </ul>
                {rec.warnings.length > 0 && (
                  <p className="mt-2 text-[11px] text-amber-800">{rec.warnings[0]}</p>
                )}
              </div>
            )}

            {!isFallback && (
              <p className="mt-3 text-[14px] font-medium leading-relaxed text-ink-soft">
                <JargonText text={explanation} />
              </p>
            )}

            <p
              className={
                isFallback
                  ? "mt-2 text-[14px] leading-relaxed text-ink-soft"
                  : "mt-1.5 text-[12px] leading-relaxed text-ink-mute line-clamp-2"
              }
            >
              <JargonText text={description} />
            </p>

            {eligibility && <ResourceFitChecker estimate={eligibility} />}

            <div className="mt-4 flex flex-wrap gap-2">
              {link && (
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 items-center gap-1.5 rounded-full bg-ink px-4 text-[13px] font-medium text-[#fbf7f0] transition-colors hover:bg-ink-soft"
                >
                  Visit →
                </a>
              )}
              {email && (
                <a
                  href={`mailto:${email}`}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full border border-rule px-4 text-[13px] font-medium text-ink-soft transition-colors hover:border-rule-strong hover:text-ink"
                >
                  Email
                </a>
              )}
              {email && founderProfile && (
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full border border-rule px-4 text-[13px] font-medium text-ink-soft transition-colors hover:border-rule-strong hover:text-ink"
                >
                  Draft email →
                </button>
              )}
              <button
                type="button"
                onClick={() => void handleFindSimilar()}
                disabled={similarLoading}
                className="inline-flex h-8 items-center gap-1.5 rounded-full border border-rule px-4 text-[13px] font-medium text-ink-soft transition-colors hover:border-rule-strong hover:text-ink disabled:opacity-50"
              >
                {similarLoading ? "…" : similarError ? "Unavailable" : "Find similar →"}
              </button>
            </div>
          </div>
        </div>
      </article>

      {founderProfile && (
        <OutreachDraftModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          founderProfile={founderProfile}
          resource={resourceForModal}
        />
      )}
    </>
  );
}
