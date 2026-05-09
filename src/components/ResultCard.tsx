import { CategoryBadge } from "@/components/CategoryBadge";
import type { MatchResultItem } from "@/app/api/match/route";

interface ResultCardProps {
  result: MatchResultItem;
  rank: number;
}

export function ResultCard({ result, rank }: ResultCardProps) {
  const { title, explanation, description, link, email, topics, communities } = result;

  const visibleCommunities = communities.filter((c) => c !== "Any");

  return (
    <article className="group relative rounded-[14px] border border-rule bg-surface-elev p-6 shadow-card transition-shadow hover:shadow-card-hover">
      <div className="flex items-start gap-4">
        <span
          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-[12px] font-bold text-surface"
          aria-label={`Result ${rank}`}
        >
          {rank}
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="font-display text-[17px] font-semibold leading-snug text-ink">
            {title}
          </h3>

          <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
            {explanation}
          </p>

          {explanation !== description && (
            <p className="mt-1.5 text-[12px] leading-relaxed text-ink-mute line-clamp-2">
              {description}
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

          <div className="mt-4 flex flex-wrap gap-2">
            {link && (
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-ink px-4 text-[13px] font-medium text-surface transition-colors hover:bg-ink-soft"
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
          </div>
        </div>
      </div>
    </article>
  );
}
