"use client";

import { useMemo } from "react";
import {
  type Company,
  type Filters,
  emptyFilters,
  getEmployees,
  getSectorColor,
  getSectors,
  getStages,
} from "@/lib/map-config";

type Props = {
  filters: Filters;
  onChange: (next: Filters) => void;
  totalCount: number;
  visibleCompanies: Company[];
  focusedId: string | null;
  onFocus: (id: string | null) => void;
};

export function MapFilters({
  filters,
  onChange,
  totalCount,
  visibleCompanies,
  focusedId,
  onFocus,
}: Props) {
  const sectors = useMemo(() => getSectors(), []);
  const stages = useMemo(() => getStages(), []);
  const employees = useMemo(() => getEmployees(), []);

  const toggle = (key: "sectors" | "stages" | "employees", value: string) => {
    const next = new Set(filters[key]);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    onChange({ ...filters, [key]: next });
  };

  const reset = () => onChange(emptyFilters());
  const hasActiveFilters =
    filters.search.trim().length > 0 ||
    filters.sectors.size > 0 ||
    filters.stages.size > 0 ||
    filters.employees.size > 0;

  return (
    <aside className="flex h-full w-full flex-col overflow-hidden border-r border-rule/70 bg-surface-elev md:w-[340px]">
      {/* Header */}
      <div className="border-b border-rule/70 px-5 py-5">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-accent">
          Utah Startup Map
        </p>
        <h1 className="mt-2 font-display text-[26px] font-semibold leading-tight tracking-tight text-ink">
          Every company being built in Utah.
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
          Filter by sector, stage, and team size. Click any pin to see details.
        </p>
      </div>

      {/* Search */}
      <div className="border-b border-rule/70 px-5 py-4">
        <label className="relative block">
          <span className="sr-only">Search companies</span>
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M11 11l3.5 3.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <input
            type="search"
            value={filters.search}
            onChange={(e) =>
              onChange({ ...filters, search: e.target.value })
            }
            placeholder="Search by name, city, or what they do…"
            className="h-10 w-full rounded-full border border-rule bg-surface pl-9 pr-3 text-[13px] text-ink placeholder:text-ink-mute/80 focus:border-accent focus:outline-none focus-visible:outline-none"
          />
        </label>
      </div>

      {/* Filters */}
      <div className="flex-1 overflow-y-auto px-5 py-5">
        <FilterGroup
          title="Sector"
          options={sectors.map((s) => ({
            value: s.value,
            count: s.count,
            color: getSectorColor(s.value),
          }))}
          active={filters.sectors}
          onToggle={(v) => toggle("sectors", v)}
        />

        <FilterGroup
          title="Stage"
          options={stages.map((s) => ({ value: s.value, count: s.count }))}
          active={filters.stages}
          onToggle={(v) => toggle("stages", v)}
          className="mt-7"
        />

        <FilterGroup
          title="Team size"
          options={employees.map((s) => ({ value: s.value, count: s.count }))}
          active={filters.employees}
          onToggle={(v) => toggle("employees", v)}
          className="mt-7"
        />

        {/* Companies list */}
        <div className="mt-8 border-t border-rule/70 pt-5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-mute">
              Companies ({visibleCompanies.length})
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={reset}
                className="text-[11px] font-medium uppercase tracking-[0.16em] text-accent hover:text-accent-hover"
              >
                Reset
              </button>
            )}
          </div>
          <ul className="mt-3 space-y-1">
            {visibleCompanies.slice(0, 80).map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => onFocus(c.id === focusedId ? null : c.id)}
                  className={`group flex w-full items-start gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors ${
                    c.id === focusedId
                      ? "bg-ink/5"
                      : "hover:bg-surface-tint/60"
                  }`}
                >
                  <span
                    className="mt-1.5 inline-flex h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: getSectorColor(c.sector) }}
                  />
                  <span className="flex-1 min-w-0">
                    <span className="block truncate text-[13px] font-medium text-ink">
                      {c.name}
                    </span>
                    <span className="block truncate text-[11px] text-ink-mute">
                      {c.city} · {c.stage}
                    </span>
                  </span>
                </button>
              </li>
            ))}
            {visibleCompanies.length > 80 && (
              <li className="px-2 pt-2 text-[11px] text-ink-mute">
                + {visibleCompanies.length - 80} more — refine filters to narrow
                down
              </li>
            )}
            {visibleCompanies.length === 0 && (
              <li className="px-2 pt-2 text-[12.5px] text-ink-mute">
                No companies match these filters.
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Footer / count */}
      <div className="border-t border-rule/70 bg-surface-tint/40 px-5 py-3 text-[11.5px] text-ink-mute">
        Showing{" "}
        <span className="font-semibold text-ink">{visibleCompanies.length}</span>{" "}
        of <span className="font-semibold text-ink">{totalCount}</span>{" "}
        Utah-based companies
      </div>
    </aside>
  );
}

type Option = { value: string; count: number; color?: string };

function FilterGroup({
  title,
  options,
  active,
  onToggle,
  className,
}: {
  title: string;
  options: Option[];
  active: Set<string>;
  onToggle: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-mute">
        {title}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const isActive = active.has(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onToggle(opt.value)}
              aria-pressed={isActive}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] transition-colors ${
                isActive
                  ? "border-ink bg-ink text-surface"
                  : "border-rule bg-surface-elev text-ink-soft hover:border-rule-strong hover:text-ink"
              }`}
            >
              {opt.color && (
                <span
                  aria-hidden="true"
                  className="inline-flex h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: opt.color }}
                />
              )}
              <span>{opt.value}</span>
              <span
                className={`text-[10.5px] ${
                  isActive ? "text-surface/70" : "text-ink-mute"
                }`}
              >
                {opt.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
