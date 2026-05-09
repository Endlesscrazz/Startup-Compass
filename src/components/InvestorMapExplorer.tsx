"use client";

import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { CompanyCompareDrawer } from "@/components/investor/CompanyCompareDrawer";
import { InvestorWatchlistDrawer } from "@/components/investor/InvestorWatchlistDrawer";
import { ClaimProfileModal } from "@/components/investor/ClaimProfileModal";
import { MapFilters } from "@/components/MapFilters";
import { CompanyDetailPanel } from "@/components/map/CompanyDetailPanel";
import { MapFloatingInsights } from "@/components/map/MapFloatingInsights";
import { useCompanyClaims } from "@/hooks/useCompanyClaims";
import { useIntentTracking } from "@/hooks/useIntentTracking";
import { useInvestorWatchlist } from "@/hooks/useInvestorWatchlist";
import { stableCompanyKey } from "@/lib/investor/companyIdentity";
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
  const { status } = useSession();
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
  const [briefBar, setBriefBar] = useState(false);
  const [mapToast, setMapToast] = useState<string | null>(null);

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

  useIntentTracking(filters, focusedCompany, visibleCompanies.map((c) => c.id));

  useEffect(() => {
    if (status !== "authenticated" || !watchlist.hydrated) return;
    const t = window.setTimeout(() => {
      void fetch("/api/watchlist", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyIds: watchlist.ids }),
      });
    }, 500);
    return () => window.clearTimeout(t);
  }, [watchlist.ids.join(","), status, watchlist.hydrated]);

  useEffect(() => {
    if (status !== "authenticated") return;
    void fetch("/api/briefs/eligibility")
      .then((r) => r.json())
      .then((j) => setBriefBar(Boolean(j.data?.showBriefCta)));
  }, [status, resolvedFocus, filters.search, watchlist.ids.join(",")]);

  const serverSyncToggleWatchlist = useCallback(
    (company: Company) => {
      const key = stableCompanyKey(company);
      const removing = watchlist.has(company);
      watchlist.toggle(company);
      if (status !== "authenticated") return;
      if (removing) {
        void fetch(`/api/watchlist?companyId=${encodeURIComponent(key)}`, { method: "DELETE" });
      } else {
        void fetch("/api/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ companyId: key }),
        });
      }
    },
    [status, watchlist],
  );

  const requestEmailBrief = useCallback(
    async (companyIds?: string[]) => {
      const ids =
        companyIds ??
        (focusedCompany ? [focusedCompany.id] : watchlist.ids.length ? watchlist.ids : undefined);
      const res = await fetch("/api/briefs/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyIds: ids,
          reason: "Exploring Utah startups on the map",
        }),
      });
      const j = await res.json();
      if (j.success) {
        setMapToast("Personalized brief saved — open Brief history to read it.");
        setBriefBar(false);
        window.setTimeout(() => setMapToast(null), 5200);
      } else {
        setMapToast(j.error ?? "Could not create brief.");
        window.setTimeout(() => setMapToast(null), 4000);
      }
    },
    [focusedCompany, watchlist.ids],
  );

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
          className="absolute left-0 top-[42%] z-[730] flex h-24 w-9 -translate-y-1/2 flex-col items-center justify-center gap-0.5 rounded-r-2xl border border-l-0 border-rule/90 bg-surface-elev/98 py-2 text-[9px] font-bold uppercase leading-tight tracking-wide text-ink shadow-md backdrop-blur-md hover:border-gold"
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
                onToggleWatchlist={() => serverSyncToggleWatchlist(focusedCompany)}
                isSignedIn={status === "authenticated"}
                showBriefCta={briefBar}
                onEmailBrief={() => void requestEmailBrief()}
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
          onToggleWatchlist={(c) => serverSyncToggleWatchlist(c)}
          compareIds={compareIds}
          onToggleCompare={toggleCompare}
          getClaimStatus={(id) => claims.getStatus(id)}
          onClaimCompany={(c) => setClaimCompany(c)}
          mapLayoutRevision={layoutNonce}
          mapChrome={mapChrome}
        />

        {status === "authenticated" && briefBar && (
          <div className="pointer-events-none absolute bottom-6 left-1/2 z-[610] flex w-[min(92vw,420px)] -translate-x-1/2 flex-col items-stretch gap-2 md:bottom-8">
            <div className="pointer-events-auto flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-rule/90 bg-surface-elev/98 px-4 py-3 text-[13px] text-ink shadow-lg backdrop-blur">
              <span className="text-ink-soft">Send a personalized brief on what you&apos;re exploring?</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-full bg-ink px-3 py-1.5 text-[12px] font-medium text-surface"
                  onClick={() => void requestEmailBrief()}
                >
                  Email brief
                </button>
                <button
                  type="button"
                  className="rounded-full border border-rule px-3 py-1.5 text-[12px] text-ink-soft"
                  onClick={() => setBriefBar(false)}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {mapToast && (
          <div className="pointer-events-none absolute bottom-6 right-4 z-[620] max-w-sm rounded-xl border border-rule bg-surface-elev/98 px-4 py-3 text-[13px] text-ink shadow-lg backdrop-blur">
            {mapToast}{" "}
            <Link href="/briefs" className="pointer-events-auto font-medium text-ink underline">
              Open history
            </Link>
          </div>
        )}

        <div className="pointer-events-none absolute right-3 top-14 z-[600] flex flex-row items-center justify-end gap-3 md:right-4 md:top-4">
          <button
            type="button"
            className="pointer-events-auto rounded-full border border-rule/90 bg-surface-elev/96 px-4 py-2.5 text-[11px] font-semibold text-ink shadow-md backdrop-blur-md transition-all duration-200 hover:border-gold hover:bg-surface-elev flex items-center gap-2"
            onClick={() => setWatchOpen(true)}
          >
            <svg className="w-3.5 h-3.5 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            Saved ({watchlist.count})
          </button>
          <button
            type="button"
            disabled={compareIds.length === 0}
            className="pointer-events-auto rounded-full border border-rule/90 bg-surface-elev/96 px-4 py-2.5 text-[11px] font-semibold text-ink shadow-md backdrop-blur-md transition-all duration-200 hover:border-gold hover:bg-surface-elev flex items-center gap-2 disabled:opacity-40"
            onClick={() => setCompareOpen(true)}
          >
            <svg className="w-3.5 h-3.5 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        onRemove={(c) => serverSyncToggleWatchlist(c)}
        onClear={() => {
          watchlist.clear();
          if (status === "authenticated") {
            void fetch("/api/watchlist", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ companyIds: [] }),
            });
          }
        }}
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
        <div className="h-10 w-10 animate-pulse rounded-full border-4 border-rule border-t-gold" />
        <p className="text-[12px] uppercase tracking-[0.16em]">Loading map…</p>
      </div>
    </div>
  );
}
