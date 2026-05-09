"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { ClaimStatus } from "@/hooks/useCompanyClaims";
import { ProfileCompletenessCard } from "@/components/investor/ProfileCompletenessCard";
import { SimilarCompaniesBlock } from "@/components/investor/SimilarCompaniesBlock";
import { inferHiringFromDescription } from "@/lib/investor/hiringHeuristic";
import type { Company } from "@/lib/map-config";
import { buildDirectionsUrls } from "@/lib/map/directions";

type Props = {
  company: Company;
  similar: Company[];
  nearby: Company[];
  onClose: () => void;
  onFocusCompany: (id: string) => void;
  inWatchlist: boolean;
  onToggleWatchlist: () => void;
  compareSelected: boolean;
  compareDisabled: boolean;
  onToggleCompare: () => void;
  claimStatus: ClaimStatus;
  onClaimClick: () => void;
  /** Signed-in map personalization */
  isSignedIn?: boolean;
  showBriefCta?: boolean;
  onEmailBrief?: () => void;
};

type IntelligenceData = {
  events: any[];
  insight: string;
};

export function CompanyDetailPanel({
  company,
  similar,
  nearby,
  onClose,
  onFocusCompany,
  inWatchlist,
  onToggleWatchlist,
  compareSelected,
  compareDisabled,
  onToggleCompare,
  claimStatus,
  onClaimClick,
  isSignedIn = false,
  showBriefCta = false,
  onEmailBrief,
}: Props) {
  const pathname = usePathname();
  const hiringSignal = inferHiringFromDescription(company.description);
  const directions = buildDirectionsUrls(company);

  const [intel, setIntel] = useState<IntelligenceData | null>(null);
  const [loadingIntel, setLoadingIntel] = useState(false);

  useEffect(() => {
    setIntel(null);
    setLoadingIntel(true);
    fetch(`/api/intelligence/company-detail?id=${encodeURIComponent(company.id)}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setIntel(j.data);
      })
      .catch(() => {})
      .finally(() => setLoadingIntel(false));
  }, [company.id]);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${pathname}?c=${encodeURIComponent(company.id)}`
      : "";

  const copyShare = useCallback(async () => {
    if (!shareUrl || typeof navigator === "undefined" || !navigator.clipboard)
      return;
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      /* ignore */
    }
  }, [shareUrl]);

  const claimBadge =
    claimStatus === "verified"
      ? { label: "Domain matched", className: "bg-emerald-600/15 text-emerald-900" }
      : claimStatus === "manual_review"
        ? {
            label: "Manual review",
            className: "bg-amber-500/15 text-amber-900",
          }
        : claimStatus === "pending"
          ? { label: "Claim pending", className: "bg-surface-tint text-ink" }
          : { label: "Unclaimed", className: "bg-surface-tint text-ink-mute" };

  return (
    <div className="border-t border-rule/70 bg-surface-tint/30 px-5 py-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-mute">
            Selected company
          </p>
          <h2 className="mt-1 font-display text-[20px] font-semibold leading-tight text-ink">
            {company.name}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-rule bg-surface px-2 py-0.5 text-[10px] font-medium text-ink-soft">
              {company.sector}
            </span>
            <span className="rounded-full border border-rule bg-surface px-2 py-0.5 text-[10px] font-medium text-ink-soft">
              {company.stage}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${claimBadge.className}`}
            >
              {claimBadge.label}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-full border border-rule px-2 py-1 text-[11px] text-ink-soft hover:border-gold hover:text-ink"
          aria-label="Close details"
        >
          Close
        </button>
      </div>

      {company.description && (
        <p className="mt-3 line-clamp-5 text-[13px] leading-relaxed text-ink-soft">
          {company.description}
        </p>
      )}

      {/* Intelligence Insight Block (Enhanced Visibility) */}
      <div className="mt-6 rounded-xl border-2 border-indigo-500/20 bg-indigo-50/50 p-4 shadow-[0_4px_12px_-2px_rgba(79,70,229,0.1)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-[10px] text-white">
              ✦
            </span>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-indigo-700">
              Intelligence Insight
            </p>
          </div>
          {loadingIntel && (
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-500" />
          )}
        </div>
        
        <div className="mt-3 min-h-[40px]">
          {loadingIntel ? (
            <p className="text-[12px] text-indigo-400 animate-pulse italic">
              Analyzing signals for {company.name}...
            </p>
          ) : intel?.insight ? (
            <p className="text-[13px] font-medium leading-relaxed text-indigo-900">
              &ldquo;{intel.insight}&rdquo;
            </p>
          ) : (
            <p className="text-[12px] italic text-indigo-400">
              No specific intelligence insight available at this time.
            </p>
          )}
        </div>
      </div>

      {/* Signal Feed Block */}
      <div className="mt-4 rounded-xl border border-rule/70 bg-surface-elev/60 p-4 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-mute">
          Recent Signal Feed
        </p>
        <ul className="mt-3 space-y-3">
          {intel?.events && intel.events.length > 0 ? (
            intel.events.map((e) => (
              <li key={e.id} className="flex items-start gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <div className="min-w-0">
                  <p className="text-[12.5px] font-medium leading-tight text-ink">
                    {e.summary}
                  </p>
                  <p className="mt-1 text-[10px] text-ink-mute">
                    {new Date(e.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric"
                    })} · {e.event_type.replace(/_/g, " ")}
                  </p>
                </div>
              </li>
            ))
          ) : !loadingIntel ? (
            <li className="text-[12px] text-ink-mute italic">
              No recent signals detected in the ecosystem stream.
            </li>
          ) : (
            <li className="h-12 animate-pulse rounded bg-ink/5" />
          )}
        </ul>
      </div>

      <ProfileCompletenessCard company={company} />

      <div className="mt-6 flex flex-wrap gap-2 border-t border-rule/70 pt-5">
        {company.website && (
          <a
            href={company.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-full bg-ink px-3 py-1.5 text-[11px] font-medium text-surface hover:bg-ink-soft"
          >
            Website
          </a>
        )}
        {company.linkedin && (
          <a
            href={company.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-full border border-ink/15 px-3 py-1.5 text-[11px] font-medium text-ink hover:border-ink/30"
          >
            LinkedIn
          </a>
        )}
        {directions && (
          <a
            href={directions.googleMaps}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-full border border-gold/50 bg-gold-soft/50 px-3 py-1.5 text-[11px] font-medium text-ink hover:border-gold"
          >
            Directions
          </a>
        )}
        <button
          type="button"
          onClick={copyShare}
          className="rounded-full border border-rule px-3 py-1.5 text-[11px] font-medium text-ink-soft hover:border-gold hover:text-ink"
        >
          Copy link
        </button>
        <button
          type="button"
          onClick={onToggleWatchlist}
          className={`rounded-full px-3 py-1.5 text-[11px] font-medium ${
            inWatchlist
              ? "border border-gold bg-gold-soft text-ink"
              : "border border-rule bg-surface text-ink-soft hover:border-gold"
          }`}
        >
          {inWatchlist ? "Following" : "Follow"}
        </button>
        <button
          type="button"
          disabled={compareDisabled}
          onClick={onToggleCompare}
          className={`rounded-full px-3 py-1.5 text-[11px] font-medium ${
            compareSelected
              ? "border border-ink bg-ink text-surface"
              : "border border-rule bg-surface text-ink-soft hover:border-ink/30 disabled:opacity-40"
          }`}
        >
          {compareSelected ? "In compare" : "Compare"}
        </button>
      </div>

      <details className="mt-5 rounded-lg border border-rule/70 bg-surface-elev/60 px-3 py-2">
        <summary className="cursor-pointer text-[11px] font-semibold text-ink">
          Overview & facts
        </summary>
        <dl className="mt-2 space-y-1.5 text-[12px] text-ink-soft">
          <Fact label="Location" value={`${company.city}, UT`} />
          {company.address && <Fact label="Address" value={company.address} />}
          <Fact label="Team size" value={company.employees} />
          {company.yearFounded != null && (
            <Fact label="Founded" value={String(company.yearFounded)} />
          )}
          <Fact
            label="Hiring signals"
            value={
              hiringSignal
                ? "Description mentions hiring language"
                : "No hiring keywords in description"
            }
          />
        </dl>
      </details>

      <SimilarCompaniesBlock
        companies={similar}
        onSelect={(c) => onFocusCompany(c.id)}
      />

      <NearbyBlock companies={nearby} onSelect={(c) => onFocusCompany(c.id)} />

      <button
        type="button"
        onClick={onClaimClick}
        className="mt-6 w-full rounded-lg border border-dashed border-gold/50 bg-gold-soft/40 py-2.5 text-[12px] font-medium text-ink hover:border-gold"
      >
        Claim this profile
      </button>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-[96px] shrink-0 text-ink-mute">{label}</dt>
      <dd className="min-w-0">{value}</dd>
    </div>
  );
}

function NearbyBlock({
  companies,
  onSelect,
}: {
  companies: Company[];
  onSelect: (c: Company) => void;
}) {
  if (companies.length === 0) return null;
  return (
    <div className="nearby-startups mt-4 border-t border-rule/70 pt-4">
      <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-mute">
        Nearby startups
      </p>
      <ul className="mt-2.5 space-y-1.5">
        {companies.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => onSelect(c)}
              className="w-full rounded-md px-1.5 py-1 text-left text-[12px] text-ink-soft hover:bg-surface-tint/80"
            >
              <span className="font-medium text-ink">{c.name}</span>
              <span className="text-ink-mute">
                {" "}
                · {c.sector} · {c.city}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
