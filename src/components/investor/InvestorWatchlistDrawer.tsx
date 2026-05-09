"use client";

import type { Company } from "@/lib/map-config";

export function InvestorWatchlistDrawer({
  open,
  onClose,
  companies,
  onRemove,
  onClear,
}: {
  open: boolean;
  onClose: () => void;
  companies: Company[];
  onRemove: (c: Company) => void;
  onClear: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[1100] flex justify-end bg-ink/30"
      role="dialog"
      aria-modal="true"
      aria-labelledby="watchlist-title"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-md flex-col border-l border-rule bg-surface-elev shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-rule px-4 py-3">
          <h2 id="watchlist-title" className="font-display text-lg font-semibold text-ink">
            Investor watchlist
          </h2>
          <button
            type="button"
            className="text-[13px] text-ink-mute hover:text-ink"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="flex items-center justify-between border-b border-rule px-4 py-2 text-[12px] text-ink-mute">
          <span>{companies.length} saved</span>
          {companies.length > 0 && (
            <button
              type="button"
              className="font-medium text-ink underline decoration-ink/30 underline-offset-2 hover:decoration-ink"
              onClick={onClear}
            >
              Clear all
            </button>
          )}
        </div>
        <ul className="flex-1 overflow-y-auto px-2 py-2">
          {companies.map((c) => (
            <li
              key={c.id}
              className="mb-2 rounded-lg border border-rule/70 px-3 py-2"
            >
              <div className="flex justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{c.name}</p>
                  <p className="text-[11px] text-ink-mute">
                    {c.sector} · {c.stage} · {c.city}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-2 text-[11px]">
                    {c.website && (
                      <a
                        href={c.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-ink underline decoration-ink/30 underline-offset-2 hover:decoration-ink"
                      >
                        Website
                      </a>
                    )}
                    {c.linkedin && (
                      <a
                        href={c.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-ink underline decoration-ink/30 underline-offset-2 hover:decoration-ink"
                      >
                        LinkedIn
                      </a>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className="shrink-0 text-[11px] text-ink-mute hover:text-ink"
                  onClick={() => onRemove(c)}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
          {companies.length === 0 && (
            <li className="px-3 py-8 text-center text-[13px] text-ink-mute">
              Save companies from the map to build a shortlist.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
