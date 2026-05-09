"use client";

import type { Company } from "@/lib/map-config";
import { getSectorColor } from "@/lib/map-config";
import type { ClaimStatus } from "@/hooks/useCompanyClaims";
import { ProfileCompletenessCard } from "@/components/investor/ProfileCompletenessCard";
import { SimilarCompaniesBlock } from "@/components/investor/SimilarCompaniesBlock";
import { OpportunityBadges } from "@/components/investor/OpportunityBadges";

export function CompanyMapPopup({
  company,
  similar,
  inWatchlist,
  onToggleWatchlist,
  compareSelected,
  compareDisabled,
  onToggleCompare,
  claimStatus,
  onClaimClick,
}: {
  company: Company;
  similar: Company[];
  inWatchlist: boolean;
  onToggleWatchlist: () => void;
  compareSelected: boolean;
  compareDisabled: boolean;
  onToggleCompare: () => void;
  claimStatus: ClaimStatus;
  onClaimClick: () => void;
}) {
  const color = getSectorColor(company.sector);

  const badge =
    claimStatus === "verified"
      ? { label: "Verified", className: "bg-emerald-600/15 text-emerald-900" }
      : claimStatus === "manual_review"
        ? { label: "Manual review", className: "bg-amber-500/15 text-amber-900" }
        : claimStatus === "pending"
          ? { label: "Claim pending", className: "bg-surface-tint text-ink" }
          : { label: "Unclaimed", className: "bg-surface-tint text-ink-mute" };

  return (
    <div className="text-[13px]">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="inline-flex h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span
          className="text-[10px] font-medium uppercase tracking-[0.16em]"
          style={{ color }}
        >
          {company.sector}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badge.className}`}
        >
          {badge.label}
        </span>
      </div>
      <div className="mt-2 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-[17px] font-semibold leading-tight text-ink">
            {company.name}
          </h3>
          <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-ink-mute">
            {company.stage} · {company.city}
            {company.employees && company.employees !== "Unknown" && (
              <> · {company.employees} employees</>
            )}
          </p>
        </div>
      </div>

      {/* Opportunity Badges */}
      <OpportunityBadges company={company} className="mt-2" maxBadges={4} />

      {/* Founder Needs — shown if claimed and needs are set */}
      {company.founderNeeds && company.founderNeeds.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {company.founderNeeds.slice(0, 3).map((need) => (
            <span
              key={need}
              className="inline-flex items-center rounded-full border border-rule bg-surface-tint px-2 py-0.5 text-[9.5px] font-medium text-ink-mute"
            >
              Needs: {need}
            </span>
          ))}
        </div>
      )}

      <ProfileCompletenessCard company={company} />

      <SimilarCompaniesBlock companies={similar} />

      <div className="mt-3 flex flex-wrap gap-2 border-t border-rule/70 pt-3">
        <button
          type="button"
          className={`rounded-full px-3 py-1.5 text-[11px] font-medium ${
            inWatchlist
              ? "border border-gold bg-gold-soft text-ink"
              : "border border-rule bg-surface text-ink-soft hover:border-gold"
          }`}
          onClick={onToggleWatchlist}
        >
          {inWatchlist ? "✓ Saved" : "Save to watchlist"}
        </button>
        <button
          type="button"
          disabled={compareDisabled}
          className={`rounded-full px-3 py-1.5 text-[11px] font-medium ${
            compareSelected
              ? "border border-ink bg-ink text-surface"
              : "border border-rule bg-surface text-ink-soft hover:border-ink/30 disabled:opacity-40"
          }`}
          onClick={onToggleCompare}
        >
          {compareSelected ? "In compare" : "Compare"}
        </button>
        <button
          type="button"
          className="rounded-full border border-rule px-3 py-1.5 text-[11px] font-medium text-ink-soft hover:border-gold"
          onClick={onClaimClick}
        >
          {claimStatus === "verified" ? "Edit profile" : "Claim this profile"}
        </button>
      </div>

      {company.description && (
        <p className="mt-3 line-clamp-4 text-[12.5px] leading-relaxed text-ink-soft">
          {company.description}
        </p>
      )}
      {company.address && (
        <p className="mt-2 text-[11.5px] text-ink-mute">{company.address}</p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {company.website && (
          <a
            href={company.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full bg-ink px-3 py-1.5 text-[11px] font-medium text-surface hover:bg-ink-soft"
          >
            Website
          </a>
        )}
        {company.linkedin && (
          <a
            href={company.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full border border-ink/15 px-3 py-1.5 text-[11px] font-medium text-ink hover:border-ink/30"
          >
            LinkedIn
          </a>
        )}
      </div>
    </div>
  );
}

