"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { MapFilters } from "@/components/MapFilters";
import {
  applyFilters,
  COMPANIES,
  emptyFilters,
  type Filters,
} from "@/lib/map-config";

const StartupMap = dynamic(() => import("@/components/StartupMap"), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

export default function MapPageClient() {
  const [filters, setFilters] = useState<Filters>(() => emptyFilters());
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const visibleCompanies = useMemo(() => applyFilters(filters), [filters]);

  return (
    <>
      <Header />
      <div className="flex h-[calc(100dvh-4rem)] overflow-hidden">
        {/* Mobile toggle bar */}
        <div className="absolute left-0 right-0 top-16 z-30 flex items-center justify-between border-b border-rule/70 bg-surface-elev/95 px-4 py-2 backdrop-blur md:hidden">
          <span className="text-[12.5px] text-ink-soft">
            <span className="font-semibold text-ink">
              {visibleCompanies.length}
            </span>{" "}
            of {COMPANIES.length} companies
          </span>
          <button
            type="button"
            onClick={() => setMobileFiltersOpen((v) => !v)}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-ink/15 px-3 text-[12px] font-medium text-ink hover:border-ink/30"
          >
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M2 4h10M3.5 7h7M5 10h4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            {mobileFiltersOpen ? "Hide filters" : "Filters"}
          </button>
        </div>

        {/* Sidebar */}
        <div
          className={`absolute inset-y-0 left-0 z-20 w-full max-w-md transform border-r border-rule/70 bg-surface-elev shadow-xl transition-transform md:static md:translate-x-0 md:shadow-none ${
            mobileFiltersOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <MapFilters
            filters={filters}
            onChange={(next) => {
              setFilters(next);
              // Closing focus when filters change keeps the map honest
              if (focusedId) setFocusedId(null);
            }}
            totalCount={COMPANIES.length}
            visibleCompanies={visibleCompanies}
            focusedId={focusedId}
            onFocus={(id) => {
              setFocusedId(id);
              setMobileFiltersOpen(false);
            }}
          />
        </div>

        {/* Map */}
        <div className="relative flex-1 pt-10 md:pt-0">
          <StartupMap
            companies={visibleCompanies}
            focusedId={focusedId}
            onMarkerClick={(id) => setFocusedId(id)}
          />
          {/* Tile attribution scaffold sits above the map, but Leaflet's own
              attribution control is the canonical one — see startup-map.css */}
          <div className="pointer-events-none absolute right-4 top-4 hidden rounded-full border border-rule bg-surface-elev/95 px-3 py-1.5 text-[11px] text-ink-mute shadow-sm backdrop-blur md:block">
            <span className="font-semibold text-ink">
              {visibleCompanies.length}
            </span>{" "}
            of {COMPANIES.length} companies on the map
          </div>
        </div>
      </div>
    </>
  );
}

function MapSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-surface-tint">
      <div className="flex flex-col items-center gap-3 text-ink-mute">
        <div className="h-10 w-10 animate-pulse rounded-full border-4 border-rule border-t-accent" />
        <p className="text-[12px] uppercase tracking-[0.16em]">Loading map…</p>
      </div>
    </div>
  );
}
