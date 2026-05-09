"use client";

import type { FounderProfileInput, MatchResultItem } from "@/lib/founder/types";
import { getResourceMatchReasons } from "@/lib/founder/matchReasons";

export function ResourceRecommendationCard({
  founderProfile,
  resource,
  county,
  onDraftOutreach,
}: {
  founderProfile: FounderProfileInput;
  resource: MatchResultItem;
  county?: string | null;
  onDraftOutreach: () => void;
}) {
  const reasons = getResourceMatchReasons(founderProfile, resource, { county });

  return (
    <li className="rounded-[14px] border border-rule bg-surface-elev p-5 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="font-display text-xl font-semibold text-ink">
          {resource.title}
        </h3>
        <span className="rounded-full bg-surface-tint px-2.5 py-1 text-[11px] font-medium text-ink-soft">
          score {resource.score}
        </span>
      </div>

      <div className="mt-3 rounded-lg bg-surface-tint/60 px-3 py-2">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-ink-mute">
          Why this matches you
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-[13px] text-ink-soft">
          {reasons.slice(0, 4).map((r, i) => (
            <li key={`${resource.id}-reason-${i}`}>{r}</li>
          ))}
        </ul>
      </div>

      <p className="mt-3 text-[14px] leading-relaxed text-ink-soft">
        {resource.explanation}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {resource.topics.slice(0, 6).map((t) => (
          <span
            key={t}
            className="rounded-full border border-rule px-2 py-0.5 text-[11px] text-ink-mute"
          >
            {t}
          </span>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {resource.link && (
          <a
            href={resource.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex rounded-full border border-rule px-3 py-1.5 text-[12px] font-medium text-accent hover:border-accent"
          >
            Visit resource
          </a>
        )}
        <button
          type="button"
          className="inline-flex rounded-full bg-ink px-3 py-1.5 text-[12px] font-medium text-surface hover:bg-ink-soft"
          onClick={onDraftOutreach}
        >
          Draft outreach email
        </button>
      </div>
    </li>
  );
}
