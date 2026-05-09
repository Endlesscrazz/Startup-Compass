"use client";

import type { Company } from "@/lib/map-config";

export function SimilarCompaniesBlock({
  companies,
  onSelect,
}: {
  companies: Company[];
  /** When set, rows become buttons that focus the company on the map */
  onSelect?: (c: Company) => void;
}) {
  if (companies.length === 0) return null;
  return (
    <div className="similar-startups mt-3 border-t border-rule/70 pt-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-mute">
        Similar Utah startups
      </p>
      <ul className="mt-2 space-y-1.5">
        {companies.map((c) => (
          <li key={c.id} className="text-[12px] text-ink-soft">
            {onSelect ? (
              <button
                type="button"
                onClick={() => onSelect(c)}
                className="w-full rounded-md px-1 py-0.5 text-left hover:bg-surface-tint/80"
              >
                <span className="font-medium text-ink">{c.name}</span>
                <span className="text-ink-mute">
                  {" "}
                  · {c.sector} · {c.city}
                </span>
              </button>
            ) : (
              <>
                <span className="font-medium text-ink">{c.name}</span>
                <span className="text-ink-mute">
                  {" "}
                  · {c.sector} · {c.city}
                </span>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
