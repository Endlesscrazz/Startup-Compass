"use client";

import { useMemo, type ReactNode } from "react";
import type { MapDiscoveryPreset } from "@/lib/map/discoveryPresets";
import { SavedSearchDrawer } from "@/components/SavedSearchDrawer";
import {
  type Company,
  type Filters,
  emptyFilters,
  getCities,
  getEmployees,
  getSectorColor,
  getSectors,
  getStages,
  type SortMode,
} from "@/lib/map-config";

type Props = {
  filters: Filters;
  onChange: (next: Filters) => void;
  totalCount: number;
  visibleCompanies: Company[];
  focusedId: string | null;
  onFocus: (id: string | null) => void;
  sortMode: SortMode;
  onSortChange: (mode: SortMode) => void;
  discoveryPresets?: MapDiscoveryPreset[];
  onDiscoveryPreset?: (preset: MapDiscoveryPreset) => void;
  detailSlot?: ReactNode;
  onRequestNearMe?: () => void;
  nearMePending?: boolean;
  /** Collapse the discovery drawer (desktop) or close overlay (mobile) */
  onRequestHide?: () => void;
  /** Allow restoring a saved search from the sidebar */
  onApplySavedSearch?: (filters: Filters) => void;
};

export function MapFilters({
  filters,
  onChange,
  totalCount,
  visibleCompanies,
  focusedId,
  onFocus,
  sortMode,
  onSortChange,
  discoveryPresets = [],
  onDiscoveryPreset,
  detailSlot,
  onRequestNearMe,
  nearMePending,
  onRequestHide,
  onApplySavedSearch,
}: Props) {
  const sectors = useMemo(() => getSectors(), []);
  const stages = useMemo(() => getStages(), []);
  const employees = useMemo(() => getEmployees(), []);
  const cities = useMemo(() => getCities(16), []);

  const toggle = (
    key: "sectors" | "stages" | "employees" | "cities",
    value: string,
  ) => {
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
    filters.employees.size > 0 ||
    filters.cities.size > 0 ||
    filters.minCompletenessScore != null ||
    filters.geoFilter != null ||
    filters.hiringOnly ||
    filters.remoteOnly ||
    filters.universityConnected ||
    filters.claimedOnly ||
    (filters.founderNeedsTags && filters.founderNeedsTags.length > 0) ||
    filters.recentlyUpdatedDays != null;

  return (
    <aside className="flex h-full w-full min-h-0 flex-col overflow-hidden border-r border-rule/70 bg-surface-elev shadow-[4px_0_24px_-8px_rgba(11,27,51,0.15)] md:w-[360px]">
      <div className="flex shrink-0 items-start justify-between gap-2 border-b border-rule/70 px-4 py-3 md:px-5 md:py-4">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-accent">
            Utah Startup Map
          </p>
          <h1 className="mt-1 font-display text-[22px] font-semibold leading-tight tracking-tight text-ink md:text-[26px]">
            Discover Utah startups
          </h1>
        </div>
        {onRequestHide && (
          <button
            type="button"
            onClick={onRequestHide}
            className="shrink-0 rounded-full border border-rule px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-mute hover:border-accent hover:text-ink"
            aria-label="Hide list and show full map"
          >
            Hide
          </button>
        )}
      </div>
      <p className="shrink-0 border-b border-rule/70 px-4 pb-3 text-[13px] leading-relaxed text-ink-soft md:px-5">
        Search, filter, and select a company for details.
      </p>

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
            placeholder="Search name, city, sector, stage, website…"
            className="h-10 w-full rounded-full border border-rule bg-surface pl-9 pr-3 text-[13px] text-ink placeholder:text-ink-mute/80 focus:border-accent focus:outline-none focus-visible:outline-none"
          />
        </label>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-[11px] text-ink-mute">
            <span className="sr-only">Sort</span>
            Sort
            <select
              value={sortMode}
              onChange={(e) => onSortChange(e.target.value as SortMode)}
              className="rounded-full border border-rule bg-surface px-2 py-1 text-[12px] text-ink focus:border-accent focus:outline-none"
            >
              <option value="relevance">Smart order</option>
              <option value="name">Name A–Z</option>
              <option value="city">City</option>
              <option value="stage">Stage</option>
            </select>
          </label>
          {onRequestNearMe && (
            <button
              type="button"
              onClick={onRequestNearMe}
              disabled={nearMePending}
              className="rounded-full border border-rule bg-surface px-2.5 py-1 text-[11px] font-medium text-ink-soft hover:border-accent hover:text-ink disabled:opacity-50"
            >
              {nearMePending ? "Locating…" : "Near me"}
            </button>
          )}
        </div>

        {filters.geoFilter && (
          <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-accent/40 bg-accent-soft/50 px-3 py-2 text-[11px] text-ink">
            <span>
              Within ~{filters.geoFilter.maxKm} km of your location
            </span>
            <button
              type="button"
              className="shrink-0 font-semibold text-accent hover:text-accent-hover"
              onClick={() =>
                onChange({ ...filters, geoFilter: undefined })
              }
            >
              Clear
            </button>
          </div>
        )}

        {discoveryPresets.length > 0 && onDiscoveryPreset && (
          <div className="mt-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-mute">
              Explore by goal
            </p>
            <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
              {discoveryPresets.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  title={p.description}
                  onClick={() => onDiscoveryPreset(p)}
                  className="shrink-0 rounded-full border border-rule bg-surface px-2.5 py-1 text-[11px] font-medium text-ink-soft hover:border-accent hover:text-ink"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 py-5">
        <FilterGroup
          title="City"
          options={cities.map((s) => ({ value: s.value, count: s.count }))}
          active={filters.cities}
          onToggle={(v) => toggle("cities", v)}
        />

        <FilterGroup
          title="Sector"
          options={sectors.map((s) => ({
            value: s.value,
            count: s.count,
            color: getSectorColor(s.value),
          }))}
          active={filters.sectors}
          onToggle={(v) => toggle("sectors", v)}
          className="mt-7"
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

        {/* ── Opportunity-based filters ── */}
        <div className="mt-7">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-mute">
            Opportunities
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <OpportunityToggle
              id="filter-hiring"
              label="Hiring Now"
              active={!!filters.hiringOnly}
              onToggle={() =>
                onChange({ ...filters, hiringOnly: filters.hiringOnly ? undefined : true })
              }
              emoji="⚙️"
            />
            <OpportunityToggle
              id="filter-remote"
              label="Remote / Hybrid"
              active={!!filters.remoteOnly}
              onToggle={() =>
                onChange({ ...filters, remoteOnly: filters.remoteOnly ? undefined : true })
              }
              emoji="🏠"
            />
            <OpportunityToggle
              id="filter-university"
              label="University Connected"
              active={!!filters.universityConnected}
              onToggle={() =>
                onChange({
                  ...filters,
                  universityConnected: filters.universityConnected ? undefined : true,
                })
              }
              emoji="🎓"
            />
            <OpportunityToggle
              id="filter-new"
              label="New This Week"
              active={filters.recentlyUpdatedDays === 7}
              onToggle={() =>
                onChange({
                  ...filters,
                  recentlyUpdatedDays:
                    filters.recentlyUpdatedDays === 7 ? undefined : 7,
                })
              }
              emoji="✨"
            />
            <OpportunityToggle
              id="filter-claimed"
              label="Founder Claimed"
              active={!!filters.claimedOnly}
              onToggle={() =>
                onChange({ ...filters, claimedOnly: filters.claimedOnly ? undefined : true })
              }
              emoji="✅"
            />
          </div>
        </div>


        {detailSlot}

        {/* Saved Searches */}
        {onApplySavedSearch && (
          <div className="mt-6">
            <SavedSearchDrawer
              filters={filters}
              onApply={onApplySavedSearch}
            />
          </div>
        )}


        <div className="mt-8 border-t border-rule/70 pt-5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-mute">
              Results ({visibleCompanies.length})
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={reset}
                className="text-[11px] font-medium uppercase tracking-[0.16em] text-accent hover:text-accent-hover"
              >
                Reset all
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
                  <span className="min-w-0 flex-1">
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

      <div className="border-t border-rule/70 bg-surface-tint/40 px-5 py-3 text-[11.5px] text-ink-mute">
        Showing{" "}
        <span className="font-semibold text-ink">{visibleCompanies.length}</span>{" "}
        of <span className="font-semibold text-ink">{totalCount}</span>{" "}
        Utah-based companies in this export
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

function OpportunityToggle({
  id,
  label,
  active,
  onToggle,
  emoji,
}: {
  id: string;
  label: string;
  active: boolean;
  onToggle: () => void;
  emoji: string;
}) {
  return (
    <button
      type="button"
      id={id}
      onClick={onToggle}
      aria-pressed={active}
      className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-[12px] font-medium transition-colors ${
        active
          ? "border-accent bg-accent-soft text-ink"
          : "border-rule bg-surface text-ink-soft hover:border-rule-strong hover:text-ink"
      }`}
    >
      <span className="text-[15px] leading-none" aria-hidden="true">
        {emoji}
      </span>
      <span className="flex-1 text-left">{label}</span>
      <span
        className={`h-3.5 w-3.5 rounded-full border-2 transition-colors ${
          active ? "border-accent bg-accent" : "border-rule"
        }`}
        aria-hidden="true"
      />
    </button>
  );
}
