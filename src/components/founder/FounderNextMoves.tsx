"use client";

import type { FounderMove } from "@/lib/founder/types";

export function FounderNextMoves({ moves }: { moves: FounderMove[] }) {
  if (moves.length === 0) return null;
  return (
    <section
      className="founder-next-moves rounded-[14px] border border-rule bg-surface-tint/50 p-5"
      aria-label="Your Next 3 Moves"
    >
      <h3 className="font-display text-lg font-semibold text-ink">
        Your Next 3 Moves
      </h3>
      <ol className="mt-4 space-y-4">
        {moves.map((m) => (
          <li key={m.priority} className="flex gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-[13px] font-semibold text-surface">
              {m.priority}
            </span>
            <div className="min-w-0">
              <p className="font-medium text-ink">{m.title}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
                {m.explanation}
              </p>
              {m.resourceLink && (
                <a
                  href={m.resourceLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex text-[12px] font-medium text-ink underline decoration-ink/30 underline-offset-2 hover:decoration-ink"
                >
                  Open related resource
                </a>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
