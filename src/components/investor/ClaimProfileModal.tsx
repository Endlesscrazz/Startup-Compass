"use client";

import { useState, type FormEvent } from "react";
import type { Company } from "@/lib/map-config";
import {
  isCompanyEmailMatch,
  normalizeDomain,
} from "@/lib/investor/verification";
import type { SubmitClaimInput } from "@/hooks/useCompanyClaims";
import { FounderNeedsPanel } from "@/components/investor/FounderNeedsPanel";

const STEPS = ["Verify", "Profile", "Needs"] as const;
type Step = (typeof STEPS)[number];

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
  const [step, setStep] = useState<Step>("Verify");

  // Step 1 — Verify identity
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [website, setWebsite] = useState("");
  const [note, setNote] = useState("");

  // Step 2 — Profile enrichment
  const [hiringStatus, setHiringStatus] = useState<
    "hiring" | "not-hiring" | "unknown"
  >("unknown");
  const [remotePolicy, setRemotePolicy] = useState<
    "remote" | "hybrid" | "in-person" | "unknown"
  >("unknown");
  const [investorInterest, setInvestorInterest] = useState<
    "yes" | "no" | "maybe"
  >("maybe");
  const [openRoles, setOpenRoles] = useState("");

  // Step 3 — Founder needs
  const [founderNeeds, setFounderNeeds] = useState<string[]>([]);

  const [hint, setHint] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (!open || !company) return null;

  const reset = () => {
    setStep("Verify");
    setName(""); setEmail(""); setRole(""); setWebsite(""); setNote("");
    setHiringStatus("unknown"); setRemotePolicy("unknown");
    setInvestorInterest("maybe"); setOpenRoles("");
    setFounderNeeds([]);
    setHint(null); setSubmitted(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const onVerifySubmit = (e: FormEvent) => {
    e.preventDefault();
    const websiteFinal = website.trim() || company.website || "";
    const match = isCompanyEmailMatch(email, company.website ?? websiteFinal);
    setHint(
      match
        ? "Domain match detected — profile will be marked verified."
        : "Manual review required — domain did not match company website.",
    );
    setStep("Profile");
  };

  const onFinalSubmit = () => {
    const websiteFinal = website.trim() || company.website || "";
    submitClaim({
      companyId: company.id,
      companyWebsite: company.website,
      name,
      email,
      role,
      website: websiteFinal,
      note,
      // Extended fields stored in note for now (until backend supports them)
      // Will be persisted when founder profile store is extended
    });
    // Store extended data locally under a separate key
    try {
      const profileData = {
        companyId: company.id,
        hiringStatus,
        remotePolicy,
        investorInterest,
        openRoles,
        founderNeeds,
        updatedAt: new Date().toISOString(),
      };
      const existing = JSON.parse(
        window.localStorage.getItem("sc-founder-profiles-v1") ?? "{}",
      ) as Record<string, unknown>;
      existing[company.id] = profileData;
      window.localStorage.setItem(
        "sc-founder-profiles-v1",
        JSON.stringify(existing),
      );
    } catch {
      /* ignore */
    }
    setSubmitted(true);
  };

  const stepIndex = STEPS.indexOf(step);
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  if (submitted) {
    return (
      <div
        className="fixed inset-0 z-[1300] flex items-end justify-center bg-ink/40 p-4 md:items-center"
        role="dialog"
        aria-modal="true"
      >
        <div className="w-full max-w-md rounded-2xl border border-rule bg-surface-elev p-6 shadow-[var(--shadow-card)] text-center">
          <div className="text-[44px]" aria-hidden="true">🎉</div>
          <h2 className="mt-3 font-display text-[20px] font-semibold text-ink">
            Profile claimed!
          </h2>
          <p className="mt-2 text-[13px] text-ink-mute leading-relaxed">
            {hint} Your profile updates are live for the community.
          </p>
          {founderNeeds.length > 0 && (
            <p className="mt-2 text-[12px] text-ink-soft">
              We've shared that you need:{" "}
              <strong>{founderNeeds.join(", ")}</strong>
            </p>
          )}
          <button
            type="button"
            onClick={handleClose}
            className="mt-5 w-full rounded-full bg-ink py-2.5 text-[13px] font-medium text-surface hover:bg-ink-soft"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[1300] flex items-end justify-center bg-ink/40 p-4 md:items-center"
      role="dialog"
      aria-modal="true"
    >
      <div className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-rule bg-surface-elev shadow-[var(--shadow-card)]">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">
              Claim this profile
            </h2>
            <p className="mt-0.5 text-[12px] text-ink-mute">
              For <strong>{company.name}</strong>
              {company.website && (
                <> ({normalizeDomain(company.website)})</>
              )}
            </p>
          </div>
          <button
            type="button"
            className="shrink-0 text-[13px] text-ink-mute hover:text-ink"
            onClick={handleClose}
          >
            ✕
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-5 pb-4">
          <div className="flex gap-1 mb-1">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i <= stepIndex ? "bg-accent" : "bg-rule"
                }`}
              />
            ))}
          </div>
          <p className="text-[10.5px] text-ink-mute">
            Step {stepIndex + 1} of {STEPS.length} — {step}
          </p>
        </div>

        {/* ── STEP 1: Verify ─────────────────────────────────── */}
        {step === "Verify" && (
          <form onSubmit={onVerifySubmit} className="px-5 pb-5 space-y-3">
            <label className="block text-[12px] text-ink-soft">
              Your name
              <input
                required
                className="mt-1 w-full rounded-lg border border-rule bg-surface px-3 py-2 text-[14px] text-ink focus:border-accent focus:outline-none"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label className="block text-[12px] text-ink-soft">
              Work email
              <input
                required
                type="email"
                className="mt-1 w-full rounded-lg border border-rule bg-surface px-3 py-2 text-[14px] text-ink focus:border-accent focus:outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="block text-[12px] text-ink-soft">
              Role / title
              <input
                required
                className="mt-1 w-full rounded-lg border border-rule bg-surface px-3 py-2 text-[14px] text-ink focus:border-accent focus:outline-none"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </label>
            <label className="block text-[12px] text-ink-soft">
              Company website (confirm)
              <input
                className="mt-1 w-full rounded-lg border border-rule bg-surface px-3 py-2 text-[14px] text-ink focus:border-accent focus:outline-none"
                value={website}
                placeholder={company.website ?? ""}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </label>
            <label className="block text-[12px] text-ink-soft">
              Note (optional)
              <textarea
                className="mt-1 min-h-[64px] w-full rounded-lg border border-rule bg-surface px-3 py-2 text-[14px] text-ink focus:border-accent focus:outline-none"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </label>
            <button
              type="submit"
              className="mt-2 w-full rounded-full bg-ink py-2.5 text-[13px] font-medium text-surface hover:bg-ink-soft"
            >
              Continue →
            </button>
          </form>
        )}

        {/* ── STEP 2: Profile ─────────────────────────────────── */}
        {step === "Profile" && (
          <div className="px-5 pb-5 space-y-4">
            {hint && (
              <p className="rounded-lg bg-surface-tint px-3 py-2 text-[12px] text-ink-soft">
                {hint}
              </p>
            )}

            <div>
              <p className="text-[12px] font-medium text-ink-soft mb-2">
                Are you currently hiring?
              </p>
              <div className="flex gap-2">
                {(["hiring", "not-hiring", "unknown"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setHiringStatus(v)}
                    className={`flex-1 rounded-lg border py-2 text-[12px] font-medium transition-colors ${
                      hiringStatus === v
                        ? "border-accent bg-accent-soft text-ink"
                        : "border-rule bg-surface text-ink-soft hover:border-accent"
                    }`}
                  >
                    {v === "hiring" ? "Yes" : v === "not-hiring" ? "No" : "Unsure"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[12px] font-medium text-ink-soft mb-2">
                Work policy
              </p>
              <div className="flex gap-2 flex-wrap">
                {(
                  [
                    ["remote", "Remote"],
                    ["hybrid", "Hybrid"],
                    ["in-person", "In-person"],
                    ["unknown", "Not sure"],
                  ] as const
                ).map(([v, label]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setRemotePolicy(v)}
                    className={`rounded-full border px-3 py-1 text-[11.5px] font-medium transition-colors ${
                      remotePolicy === v
                        ? "border-accent bg-accent-soft text-ink"
                        : "border-rule bg-surface text-ink-soft hover:border-accent"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[12px] font-medium text-ink-soft mb-2">
                Open to investor conversations?
              </p>
              <div className="flex gap-2">
                {(["yes", "maybe", "no"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setInvestorInterest(v)}
                    className={`flex-1 rounded-lg border py-2 text-[12px] font-medium capitalize transition-colors ${
                      investorInterest === v
                        ? "border-accent bg-accent-soft text-ink"
                        : "border-rule bg-surface text-ink-soft hover:border-accent"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <label className="block text-[12px] text-ink-soft">
              Open roles (optional)
              <input
                className="mt-1 w-full rounded-lg border border-rule bg-surface px-3 py-2 text-[14px] text-ink focus:border-accent focus:outline-none"
                placeholder="e.g. Senior Engineer, Product Designer"
                value={openRoles}
                onChange={(e) => setOpenRoles(e.target.value)}
              />
            </label>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep("Verify")}
                className="flex-1 rounded-full border border-rule py-2.5 text-[13px] font-medium text-ink-soft hover:border-rule-strong"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep("Needs")}
                className="flex-1 rounded-full bg-ink py-2.5 text-[13px] font-medium text-surface hover:bg-ink-soft"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Needs ─────────────────────────────────── */}
        {step === "Needs" && (
          <div className="px-5 pb-5 space-y-4">
            <FounderNeedsPanel
              selected={founderNeeds}
              onChange={setFounderNeeds}
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep("Profile")}
                className="flex-1 rounded-full border border-rule py-2.5 text-[13px] font-medium text-ink-soft hover:border-rule-strong"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={onFinalSubmit}
                className="flex-1 rounded-full bg-accent py-2.5 text-[13px] font-medium text-white hover:bg-accent-hover"
              >
                Submit claim
              </button>
            </div>

            <p className="text-center text-[11px] text-ink-mute">
              This is a prototype — data is stored locally in your browser.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
