"use client";

import type { Company } from "@/lib/map-config";
import { computeBadges } from "@/lib/map/opportunityBadges";

const BASE_FIELDS: {
  key: keyof Company;
  label: string;
}[] = [
  { key: "name", label: "Company" },
  { key: "sector", label: "Sector" },
  { key: "stage", label: "Stage" },
  { key: "employees", label: "Team Size" },
  { key: "city", label: "Location" },
  { key: "yearFounded", label: "Founded" },
  { key: "hiringStatus", label: "Hiring Status" },
  { key: "remotePolicy", label: "Remote Policy" },
  { key: "universityConnected", label: "University" },
  { key: "website", label: "Website" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "description", label: "Description" },
];

function cellVal(c: Company, key: keyof Company): string | null {
  const v = c[key];
  if (v == null) return null;
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (Array.isArray(v)) return v.join(", ") || null;
  const s = String(v).trim();
  return s.length ? s : null;
}

function downloadCsv(companies: Company[]) {
  const headers = BASE_FIELDS.map((f) => f.label);
  const rows = companies.map((c) =>
    BASE_FIELDS.map((f) => {
      const val = cellVal(c, f.key);
      if (!val) return "";
      // Escape quotes in CSV
      return val.includes(",") || val.includes('"')
        ? `"${val.replace(/"/g, '""')}"`
        : val;
    }),
  );

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `startup-comparison-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function CompanyCompareDrawer({
  open,
  onClose,
  companies,
}: {
  open: boolean;
  onClose: () => void;
  companies: Company[];
}) {
  if (!open || companies.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-[1150] flex items-end justify-center bg-ink/35 p-3 md:items-center"
      role="dialog"
      aria-modal="true"
    >
      <div className="max-h-[88vh] w-full max-w-4xl overflow-auto rounded-2xl border border-rule bg-surface-elev shadow-[var(--shadow-card-hover)]">
        <div className="flex items-center justify-between border-b border-rule px-4 py-3">
          <h2 className="font-display text-lg font-semibold text-ink">
            Compare companies ({companies.length}/3)
          </h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => downloadCsv(companies)}
              className="flex items-center gap-1.5 rounded-full border border-rule px-3 py-1.5 text-[11px] font-semibold text-ink-soft hover:border-accent hover:text-ink"
            >
              <svg viewBox="0 0 14 14" className="h-3 w-3" fill="none">
                <path
                  d="M7 2v7M4 7l3 3 3-3M2 11h10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Export CSV
            </button>
            <button
              type="button"
              className="text-[13px] text-ink-mute hover:text-ink"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>

        {/* Opportunity badges row */}
        <div className="flex border-b border-rule/70 bg-surface-tint/40">
          <div className="sticky left-0 z-[1] w-[120px] shrink-0 bg-surface-tint/90 px-3 py-2 text-[10px] font-medium text-ink-mute">
            Signals
          </div>
          {companies.map((c) => {
            const badges = computeBadges(c);
            return (
              <div
                key={c.id}
                className="flex-1 px-3 py-2"
                style={{ minWidth: 160 }}
              >
                {badges.length === 0 ? (
                  <span className="text-[10px] text-ink-mute">—</span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {badges.map((b) => (
                      <span
                        key={b.id}
                        title={b.description}
                        className={`inline-flex rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${b.color}`}
                      >
                        {b.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Founder needs row */}
        {companies.some((c) => c.founderNeeds && c.founderNeeds.length > 0) && (
          <div className="flex border-b border-rule/70">
            <div className="sticky left-0 z-[1] w-[120px] shrink-0 bg-surface-elev px-3 py-2 text-[10px] text-ink-mute">
              Founder Needs
            </div>
            {companies.map((c) => (
              <div
                key={c.id}
                className="flex-1 px-3 py-2 text-[11px] text-ink-soft"
                style={{ minWidth: 160 }}
              >
                {c.founderNeeds && c.founderNeeds.length > 0
                  ? c.founderNeeds.join(", ")
                  : "—"}
              </div>
            ))}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left text-[12px]">
            <thead>
              <tr className="border-b border-rule bg-surface-tint/40">
                <th className="sticky left-0 z-[1] w-[120px] bg-surface-tint/90 px-3 py-2 font-medium text-ink-mute">
                  Field
                </th>
                {companies.map((c) => (
                  <th key={c.id} className="px-3 py-2 font-semibold text-ink">
                    <div className="max-w-[160px] truncate">{c.name}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BASE_FIELDS.filter((f) => !["name"].includes(f.key as string)).map((f) => {
                const anyPresent = companies.some(
                  (c) => cellVal(c, f.key) != null,
                );
                if (!anyPresent) return null;
                return (
                  <tr key={f.key as string} className="border-b border-rule/60">
                    <td className="sticky left-0 bg-surface-elev px-3 py-2 text-ink-mute">
                      {f.label}
                    </td>
                    {companies.map((c) => (
                      <td
                        key={`${c.id}-${String(f.key)}`}
                        className="px-3 py-2 align-top text-ink-soft"
                      >
                        {f.key === "website" || f.key === "linkedin" ? (
                          cellVal(c, f.key) ? (
                            <a
                              href={cellVal(c, f.key)!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="break-all text-accent hover:text-accent-hover"
                            >
                              Link ↗
                            </a>
                          ) : (
                            "—"
                          )
                        ) : f.key === "description" ? (
                          <span className="line-clamp-3">
                            {cellVal(c, f.key) ?? "—"}
                          </span>
                        ) : (
                          cellVal(c, f.key) ?? "—"
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="border-t border-rule px-4 py-3 text-[12px] text-ink-mute">
          <p>
            Compare up to 3 companies side-by-side.{" "}
            <button
              type="button"
              onClick={() => downloadCsv(companies)}
              className="font-semibold text-accent hover:text-accent-hover"
            >
              Export as CSV
            </button>{" "}
            for use in CRMs or spreadsheets.
          </p>
        </div>
      </div>
    </div>
  );
}
