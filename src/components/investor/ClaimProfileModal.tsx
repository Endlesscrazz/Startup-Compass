"use client";

import { useState, type FormEvent } from "react";
import type { Company } from "@/lib/map-config";
import {
  isCompanyEmailMatch,
  normalizeDomain,
} from "@/lib/investor/verification";
import type { SubmitClaimInput } from "@/hooks/useCompanyClaims";

export function ClaimProfileModal({
  open,
  onClose,
  company,
  submitClaim,
}: {
  open: boolean;
  onClose: () => void;
  company: Company | null;
  submitClaim: (input: SubmitClaimInput) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [website, setWebsite] = useState("");
  const [note, setNote] = useState("");
  const [hint, setHint] = useState<string | null>(null);

  if (!open || !company) return null;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const websiteFinal = website.trim() || company.website || "";
    const match = isCompanyEmailMatch(email, company.website ?? websiteFinal);
    setHint(
      match
        ? "Domain match detected — marked verified for this prototype."
        : "Manual review required — domain did not match company website.",
    );
    submitClaim({
      companyId: company.id,
      companyWebsite: company.website,
      name,
      email,
      role,
      website: websiteFinal,
      note,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[1300] flex items-end justify-center bg-ink/40 p-4 md:items-center"
      role="dialog"
      aria-modal="true"
    >
      <form
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-rule bg-surface-elev p-5 shadow-[var(--shadow-card)]"
        onSubmit={onSubmit}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">
              Claim this profile
            </h2>
            <p className="mt-1 text-[12px] text-ink-mute">
              For <strong>{company.name}</strong>
              {company.website && (
                <>
                  {" "}
                  ({normalizeDomain(company.website)})
                </>
              )}
            </p>
          </div>
          <button
            type="button"
            className="text-[13px] text-ink-mute hover:text-ink"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <label className="mt-4 block text-[12px] text-ink-soft">
          Your name
          <input
            required
            className="mt-1 w-full rounded-lg border border-rule px-3 py-2 text-[14px] text-ink"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="mt-3 block text-[12px] text-ink-soft">
          Work email
          <input
            required
            type="email"
            className="mt-1 w-full rounded-lg border border-rule px-3 py-2 text-[14px] text-ink"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="mt-3 block text-[12px] text-ink-soft">
          Role / title
          <input
            required
            className="mt-1 w-full rounded-lg border border-rule px-3 py-2 text-[14px] text-ink"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
        </label>
        <label className="mt-3 block text-[12px] text-ink-soft">
          Company website (confirm)
          <input
            className="mt-1 w-full rounded-lg border border-rule px-3 py-2 text-[14px] text-ink"
            value={website}
            placeholder={company.website ?? ""}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </label>
        <label className="mt-3 block text-[12px] text-ink-soft">
          Note (optional)
          <textarea
            className="mt-1 min-h-[72px] w-full rounded-lg border border-rule px-3 py-2 text-[14px] text-ink"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>

        {hint && (
          <p className="mt-3 rounded-lg bg-surface-tint px-3 py-2 text-[12px] text-ink-soft">
            {hint}
          </p>
        )}

        <button
          type="submit"
          className="mt-4 w-full rounded-full bg-ink py-2.5 text-[13px] font-medium text-surface hover:bg-ink-soft"
        >
          Submit claim (prototype)
        </button>
      </form>
    </div>
  );
}
