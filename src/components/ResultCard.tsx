"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CategoryBadge } from "@/components/CategoryBadge";
import { OutreachDraftModal } from "@/components/founder/OutreachDraftModal";
import type { MatchResultItem } from "@/app/api/match/route";
import type { FounderProfileInput } from "@/lib/founder/types";

interface ResultCardProps {
  result: MatchResultItem;
  rank: number;
  founderProfile: FounderProfileInput;
  county: string;
}

export function ResultCard({ result, rank, founderProfile, county }: ResultCardProps) {
  const router = useRouter();
  const { title, explanation, description, link, email, topics, communities } = result;
  const [modalOpen, setModalOpen] = useState(false);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [similarError, setSimilarError] = useState(false);

  const visibleCommunities = communities.filter((c) => c !== "Any");

  const isFallback = explanation.endsWith("…") &&
    description.startsWith(explanation.slice(0, -1).trimEnd());

  async function handleFindSimilar() {
    setSimilarLoading(true);
    setSimilarError(false);
    try {
      const res = await fetch("/api/match/similar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceId: result.id, city: county }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      sessionStorage.setItem("sc_quiz", JSON.stringify({
        _similar: true,
        sourceTitle: data.sourceTitle,
        results: data.results,
        county: data.county,
      }));
      router.push("/results?t=" + Date.now());
    } catch {
      setSimilarError(true);
      setTimeout(() => setSimilarError(false), 2000);
    } finally {
      setSimilarLoading(false);
    }
  }

  const resourceForModal = result as unknown as import("@/lib/founder/types").MatchResultItem;

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
            <h3 className="font-display text-[17px] font-semibold leading-snug text-ink">
              {title}
            </h3>

            {!isFallback && (
              <p className="mt-2 text-[14px] font-medium leading-relaxed text-accent-dark">
                {explanation}
              </p>
            )}

            <p className={isFallback
              ? "mt-2 text-[14px] leading-relaxed text-ink-soft"
              : "mt-1.5 text-[12px] leading-relaxed text-ink-mute line-clamp-2"}>
              {description}
            </p>

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

            <div className="mt-4 flex flex-wrap gap-2">
              {link && (
                <a href={link} target="_blank" rel="noopener noreferrer"
                  className="inline-flex h-8 items-center gap-1.5 rounded-full bg-ink px-4 text-[13px] font-medium text-[#fbf7f0] transition-colors hover:bg-ink-soft">
                  Visit →
                </a>
              )}
              {email && (
                <a href={`mailto:${email}`}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full border border-rule px-4 text-[13px] font-medium text-ink-soft transition-colors hover:border-rule-strong hover:text-ink">
                  Email
                </a>
              )}
              {email && (
                <button type="button" onClick={() => setModalOpen(true)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full border border-rule px-4 text-[13px] font-medium text-ink-soft transition-colors hover:border-rule-strong hover:text-ink">
                  Draft email →
                </button>
              )}
              <button type="button" onClick={() => void handleFindSimilar()}
                disabled={similarLoading}
                className="inline-flex h-8 items-center gap-1.5 rounded-full border border-rule px-4 text-[13px] font-medium text-ink-soft transition-colors hover:border-rule-strong hover:text-ink disabled:opacity-50">
                {similarLoading ? "…" : similarError ? "Unavailable" : "Find similar →"}
              </button>
            </div>
          </div>
        </div>
      </article>

      <OutreachDraftModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        founderProfile={founderProfile}
        resource={resourceForModal}
      />
    </>
  );
}
