"use client";

import type { Company } from "@/lib/map-config";

const FIELDS: {
  key: keyof Company;
  label: string;
}[] = [
  { key: "name", label: "Name" },
  { key: "sector", label: "Sector" },
  { key: "stage", label: "Stage" },
  { key: "employees", label: "Employees" },
  { key: "city", label: "Location" },
  { key: "website", label: "Website" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "description", label: "Description" },
  { key: "address", label: "Address" },
];

function cellVal(c: Company, key: keyof Company): string | null {
  const v = c[key];
  if (v == null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
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
      <div className="max-h-[88vh] w-full max-w-4xl overflow-auto rounded-2xl border border-rule bg-surface-elev shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between border-b border-rule px-4 py-3">
          <h2 className="font-display text-lg font-semibold text-ink">
            Compare companies ({companies.length}/3)
          </h2>
          <button
            type="button"
            className="text-[13px] text-ink-mute hover:text-ink"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left text-[12px]">
            <thead>
              <tr className="border-b border-rule bg-surface-tint/40">
                <th className="sticky left-0 z-[1] bg-surface-tint/90 px-3 py-2 font-medium text-ink-mute">
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
              {FIELDS.map((f) => {
                const anyPresent = companies.some(
                  (c) => cellVal(c, f.key) != null,
                );
                if (!anyPresent) return null;
                return (
                  <tr key={f.key} className="border-b border-rule/60">
                    <td className="sticky left-0 bg-surface-elev px-3 py-2 text-ink-mute">
                      {f.label}
                    </td>
                    {companies.map((c) => (
                      <td key={`${c.id}-${String(f.key)}`} className="px-3 py-2 align-top text-ink-soft">
                        {f.key === "website" || f.key === "linkedin" ? (
                          cellVal(c, f.key) ? (
                            <a
                              href={cellVal(c, f.key)!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="break-all text-accent hover:text-accent-hover"
                            >
                              Link
                            </a>
                          ) : (
                            "—"
                          )
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
      </div>
    </div>
  );
}
