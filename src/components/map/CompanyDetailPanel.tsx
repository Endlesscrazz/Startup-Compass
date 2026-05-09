"use client";

import { useCallback } from "react";
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

      <ProfileCompletenessCard company={company} />

      <div className="mt-4 flex flex-wrap gap-2 border-t border-rule/70 pt-4">
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
          Copy share link
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
        {isSignedIn && showBriefCta && onEmailBrief && (
          <button
            type="button"
            onClick={onEmailBrief}
            className="rounded-full border border-ink/20 bg-surface-elev px-3 py-1.5 text-[11px] font-medium text-ink hover:border-gold"
          >
            Email me a brief
          </button>
        )}
      </div>

      <details className="mt-4 rounded-lg border border-rule/70 bg-surface-elev/60 px-3 py-2">
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
                ? "Description mentions hiring / careers language"
                : "No hiring keywords in description"
            }
          />
        </dl>
      </details>

      <details className="mt-2 rounded-lg border border-rule/70 bg-surface-elev/60 px-3 py-2">
        <summary className="cursor-pointer text-[11px] font-semibold text-ink">
          Links
        </summary>
        <ul className="mt-2 space-y-1 text-[12px]">
          {company.website && (
            <li>
              <a
                href={company.website}
                className="text-ink underline decoration-ink/30 underline-offset-2 hover:decoration-ink"
                target="_blank"
                rel="noopener noreferrer"
              >
                Website
              </a>
            </li>
          )}
          {company.linkedin && (
            <li>
              <a
                href={company.linkedin}
                className="text-ink underline decoration-ink/30 underline-offset-2 hover:decoration-ink"
                target="_blank"
                rel="noopener noreferrer"
              >
                LinkedIn
              </a>
            </li>
          )}
          {directions && (
            <li className="flex flex-wrap gap-x-3 gap-y-1">
              <a
                href={directions.googleMaps}
                className="text-ink-soft hover:text-ink"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google Maps directions
              </a>
              <a
                href={directions.appleMaps}
                className="text-ink-soft hover:text-ink"
                target="_blank"
                rel="noopener noreferrer"
              >
                Apple Maps
              </a>
              <a
                href={directions.osm}
                className="text-ink-soft hover:text-ink"
                target="_blank"
                rel="noopener noreferrer"
              >
                OpenStreetMap
              </a>
            </li>
          )}
          {!company.website && !company.linkedin && !directions && (
            <li className="text-ink-mute">No external links in this export.</li>
          )}
        </ul>
      </details>

      <SimilarCompaniesBlock
        companies={similar}
        onSelect={(c) => onFocusCompany(c.id)}
      />

      <NearbyBlock companies={nearby} onSelect={(c) => onFocusCompany(c.id)} />

      <button
        type="button"
        onClick={onClaimClick}
        className="mt-4 w-full rounded-lg border border-dashed border-gold/50 bg-gold-soft/40 py-2 text-[12px] font-medium text-ink hover:border-gold"
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
    <div className="nearby-startups mt-3 border-t border-rule/70 pt-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-mute">
        Nearby startups
      </p>
      <ul className="mt-2 space-y-1">
        {companies.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => onSelect(c)}
              className="w-full rounded-md px-1 py-1 text-left text-[12px] text-ink-soft hover:bg-surface-tint/80"
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
