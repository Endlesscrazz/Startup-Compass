"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect, useMemo, useState } from "react";
import { CompanyCompareDrawer } from "@/components/investor/CompanyCompareDrawer";
import { InvestorWatchlistDrawer } from "@/components/investor/InvestorWatchlistDrawer";
import { ClaimProfileModal } from "@/components/investor/ClaimProfileModal";
import { MapFilters } from "@/components/MapFilters";
import { CompanyDetailPanel } from "@/components/map/CompanyDetailPanel";
import { MapFloatingInsights } from "@/components/map/MapFloatingInsights";
import { useCompanyClaims } from "@/hooks/useCompanyClaims";
import { useInvestorWatchlist } from "@/hooks/useInvestorWatchlist";
import { useSelectedCompanyUrlState } from "@/hooks/useSelectedCompanyUrlState";
import { computeEcosystemStats } from "@/lib/investor/ecosystemStats";
import { findNearbyCompanies } from "@/lib/map/nearbyCompanies";
import { findSimilarCompanies } from "@/lib/investor/similarCompanies";
import {
  generateInvestorThesisPresets,
  presetToFilters,
} from "@/lib/investor/thesisPresets";
import {
  applyDiscoveryPreset,
  generateMapDiscoveryPresets,
} from "@/lib/map/discoveryPresets";
import type { Company } from "@/lib/map-config";
import {
  applyFilters,
  COMPANIES,
  emptyFilters,
  sortCompanies,
  type Filters,
  type SortMode,
} from "@/lib/map-config";

const StartupMap = dynamic(() => import("@/components/StartupMap"), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

type Props = {
  variant?: "main" | "atlas";
};

export function InvestorMapExplorer(props: Props) {
  return (
    <Suspense fallback={<MapSkeleton />}>
      <InvestorMapExplorerInner {...props} />
    </Suspense>
  );
}

function InvestorMapExplorerInner({ variant = "main" }: Props) {
  const [filters, setFilters] = useState<Filters>(() => emptyFilters());
  const [sortMode, setSortMode] = useState<SortMode>("relevance");
  const [focusedId, setFocusedId] = useState<string | null>(null);
  /** Map-first default: list/filters drawer closed until the user opens it */
  const [panelOpen, setPanelOpen] = useState(false);
  /** Collapsed ecosystem + thesis strip by default (matches minimal startup view) */
  const [insightsExpanded, setInsightsExpanded] = useState(false);
  const [layoutNonce, setLayoutNonce] = useState(0);
  const [watchOpen, setWatchOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [claimCompany, setClaimCompany] = useState<Company | null>(null);
  const [nearMePending, setNearMePending] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setLayoutNonce((n) => n + 1), 280);
    return () => window.clearTimeout(t);
  }, [panelOpen, insightsExpanded]);

  const validIds = useMemo(
    () => new Set(COMPANIES.map((c) => c.id)),
    [],
  );

  const filteredCompanies = useMemo(
    () => applyFilters(filters),
    [filters],
  );

  const resolvedFocus =
    focusedId &&
    filteredCompanies.some((c) => c.id === focusedId)
      ? focusedId
      : null;

  useSelectedCompanyUrlState(resolvedFocus, setFocusedId, validIds);

  const visibleCompanies = useMemo(
    () => sortCompanies(filteredCompanies, sortMode),
    [filteredCompanies, sortMode],
  );

  const focusedCompany = useMemo(
    () =>
      resolvedFocus
        ? COMPANIES.find((c) => c.id === resolvedFocus) ?? null
        : null,
    [resolvedFocus],
  );

  const similarForFocused = useMemo(
    () =>
      focusedCompany
        ? findSimilarCompanies(focusedCompany, COMPANIES, 6)
        : [],
    [focusedCompany],
  );

  const nearbyForFocused = useMemo(
    () =>
      focusedCompany
        ? findNearbyCompanies(focusedCompany, COMPANIES, 8)
        : [],
    [focusedCompany],
  );

  const watchlist = useInvestorWatchlist();
  const claims = useCompanyClaims();

  const ecosystem = useMemo(() => computeEcosystemStats(COMPANIES), []);
  const thesisPresets = useMemo(
    () => generateInvestorThesisPresets(COMPANIES),
    [],
  );

  const discoveryPresets = useMemo(
    () => generateMapDiscoveryPresets(COMPANIES),
    [],
  );

  const watchedCompanies = useMemo(
    () => watchlist.resolveCompanies(COMPANIES),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed by id list only
    [watchlist.ids],
  );

  const compareCompanies = useMemo(
    () => COMPANIES.filter((c) => compareIds.includes(c.id)).slice(0, 3),
    [compareIds],
  );

  const headerRem = variant === "atlas" ? "4.5rem" : "4rem";

  const toggleCompare = (company: Company) => {
    setCompareIds((prev) => {
      if (prev.includes(company.id)) {
        return prev.filter((id) => id !== company.id);
      }
      if (prev.length >= 3) return prev;
      return [...prev, company.id];
    });
  };

  const handleNearMe = () => {
    if (!navigator.geolocation) return;
    setNearMePending(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFilters((f) => ({
          ...f,
          geoFilter: {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            maxKm: 85,
          },
        }));
        setNearMePending(false);
      },
      () => {
        setNearMePending(false);
      },
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 12_000 },
    );
  };

  const mapChrome = (
    <MapFloatingInsights
      stats={ecosystem}
      thesisPresets={thesisPresets}
      onThesisApply={(preset) =>
        setFilters(presetToFilters(emptyFilters(), preset))
      }
      expanded={insightsExpanded}
      onToggleExpanded={() => setInsightsExpanded((v) => !v)}
      padForDrawer={panelOpen}
    />
  );

  return (
    <div
      className="relative flex overflow-hidden bg-surface-tint"
      style={{
        height: `calc(100dvh - ${headerRem})`,
      }}
    >
      {/* Mobile: map-first strip */}
      <div className="absolute left-0 right-0 top-0 z-30 flex items-center justify-between border-b border-rule/70 bg-surface-elev/95 px-3 py-2 backdrop-blur md:hidden">
        <span className="text-[12.5px] text-ink-soft">
          <span className="font-semibold text-ink">
            {visibleCompanies.length}
          </span>{" "}
          match
        </span>
        <button
          type="button"
          onClick={() => setPanelOpen((v) => !v)}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-ink/15 px-3 text-[12px] font-medium text-ink hover:border-ink/30"
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
          {panelOpen ? "Map" : "Search"}
        </button>
      </div>

      {/* Google Maps–style peek tab when drawer hidden */}
      {!panelOpen && (
        <button
          type="button"
          onClick={() => setPanelOpen(true)}
          className="absolute left-0 top-[42%] z-[730] flex h-24 w-9 -translate-y-1/2 flex-col items-center justify-center gap-0.5 rounded-r-2xl border border-l-0 border-rule/90 bg-surface-elev/98 py-2 text-[9px] font-bold uppercase leading-tight tracking-wide text-ink shadow-md backdrop-blur-md hover:border-accent"
          aria-label="Open startup list and filters"
        >
          <span className="text-[14px] leading-none" aria-hidden="true">
            ›
          </span>
          List
        </button>
      )}

      {/* Discovery drawer — overlays map (desktop + mobile) */}
      <div
        suppressHydrationWarning
        className={`absolute inset-y-0 left-0 z-[720] w-[min(100vw,360px)] max-w-full transition-transform duration-300 ease-out md:w-[360px] ${
          panelOpen ? "translate-x-0 shadow-xl" : "-translate-x-full"
        } `}
      >
        <MapFilters
          filters={filters}
          onChange={setFilters}
          totalCount={COMPANIES.length}
          visibleCompanies={visibleCompanies}
          focusedId={resolvedFocus}
          onFocus={(id) => {
            setFocusedId(id);
            if (
              typeof window !== "undefined" &&
              window.matchMedia("(max-width: 767px)").matches
            ) {
              setPanelOpen(false);
            }
          }}
          sortMode={sortMode}
          onSortChange={setSortMode}
          discoveryPresets={discoveryPresets}
          onDiscoveryPreset={(preset) => {
            setFilters(applyDiscoveryPreset(preset));
            setSortMode("relevance");
          }}
          onRequestNearMe={handleNearMe}
          nearMePending={nearMePending}
          onRequestHide={() => setPanelOpen(false)}
          onApplySavedSearch={(restored) => {
            setFilters(restored);
            setSortMode("relevance");
          }}
          detailSlot={
            focusedCompany ? (
              <CompanyDetailPanel
                company={focusedCompany}
                similar={similarForFocused}
                nearby={nearbyForFocused}
                onClose={() => setFocusedId(null)}
                onFocusCompany={(id) => setFocusedId(id)}
                inWatchlist={watchlist.has(focusedCompany)}
                onToggleWatchlist={() => watchlist.toggle(focusedCompany)}
                compareSelected={compareIds.includes(focusedCompany.id)}
                compareDisabled={
                  !compareIds.includes(focusedCompany.id) &&
                  compareIds.length >= 3
                }
                onToggleCompare={() => toggleCompare(focusedCompany)}
                claimStatus={claims.getStatus(focusedCompany.id)}
                onClaimClick={() => setClaimCompany(focusedCompany)}
              />
            ) : null
          }
        />
      </div>

      {/* Full-bleed map */}
      <div className="relative min-h-0 flex-1 pt-12 md:pt-0">
        <StartupMap
          companies={filteredCompanies}
          allCompanies={COMPANIES}
          focusedId={resolvedFocus}
          onMarkerClick={(id) => setFocusedId(id)}
          inWatchlist={(c) => watchlist.has(c)}
          onToggleWatchlist={(c) => watchlist.toggle(c)}
          compareIds={compareIds}
          onToggleCompare={toggleCompare}
          getClaimStatus={(id) => claims.getStatus(id)}
          onClaimCompany={(c) => setClaimCompany(c)}
          mapLayoutRevision={layoutNonce}
          mapChrome={mapChrome}
        />

        <div className="pointer-events-none absolute right-3 top-14 z-[600] flex flex-row items-center justify-end gap-3 md:right-4 md:top-4">
          <button
            type="button"
            className="pointer-events-auto rounded-full border border-rule/90 bg-surface-elev/96 px-4 py-2.5 text-[11px] font-semibold text-ink shadow-md backdrop-blur-md transition-all duration-200 hover:border-accent hover:bg-surface-elev flex items-center gap-2"
            onClick={() => setWatchOpen(true)}
          >
            <svg className="w-3.5 h-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            Saved ({watchlist.count})
          </button>
          <button
            type="button"
            disabled={compareIds.length === 0}
            className="pointer-events-auto rounded-full border border-rule/90 bg-surface-elev/96 px-4 py-2.5 text-[11px] font-semibold text-ink shadow-md backdrop-blur-md transition-all duration-200 hover:border-accent hover:bg-surface-elev flex items-center gap-2 disabled:opacity-40"
            onClick={() => setCompareOpen(true)}
          >
            <svg className="w-3.5 h-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Compare ({compareIds.length})
          </button>
        </div>
      </div>

      <InvestorWatchlistDrawer
        open={watchOpen}
        onClose={() => setWatchOpen(false)}
        companies={watchedCompanies}
        onRemove={(c) => watchlist.toggle(c)}
        onClear={() => watchlist.clear()}
      />

      <CompanyCompareDrawer
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        companies={compareCompanies}
      />

      <ClaimProfileModal
        open={claimCompany != null}
        onClose={() => setClaimCompany(null)}
        company={claimCompany}
        submitClaim={(input) => {
          claims.submitClaim(input);
          setClaimCompany(null);
        }}
      />
    </div>
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
