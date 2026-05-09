"use client";

import { useState } from "react";
import type { FounderProfileInput, MatchResultItem } from "@/lib/founder/types";
import { generateResourceOutreachDraft } from "@/lib/founder/outreachDraft";

export function OutreachDraftModal({
  open,
  onClose,
  founderProfile,
  resource,
}: {
  open: boolean;
  onClose: () => void;
  founderProfile: FounderProfileInput;
  resource: MatchResultItem | null;
}) {
  const [copied, setCopied] = useState(false);
  const draft =
    resource != null
      ? generateResourceOutreachDraft(founderProfile, resource)
      : "";

  if (!open || !resource) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1200] flex items-end justify-center bg-ink/40 p-4 md:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="outreach-draft-title"
    >
      <div className="max-h-[85vh] w-full max-w-lg overflow-hidden rounded-2xl border border-rule bg-surface-elev shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between border-b border-rule px-4 py-3">
          <h2 id="outreach-draft-title" className="font-display text-lg font-semibold text-ink">
            Draft outreach email
          </h2>
          <button
            type="button"
            className="rounded-full px-2 py-1 text-[13px] text-ink-mute hover:bg-surface-tint"
            onClick={() => {
              setCopied(false);
              onClose();
            }}
          >
            Close
          </button>
        </div>
        <div className="max-h-[50vh] overflow-y-auto px-4 py-3">
          <pre className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-ink-soft">
            {draft}
          </pre>
        </div>
        <div className="flex gap-2 border-t border-rule px-4 py-3">
          <button
            type="button"
            className="flex-1 rounded-full bg-ink py-2 text-[13px] font-medium text-surface hover:bg-ink-soft"
            onClick={() => void copy()}
          >
            {copied ? "Copied" : "Copy draft"}
          </button>
        </div>
      </div>
    </div>
  );
}
