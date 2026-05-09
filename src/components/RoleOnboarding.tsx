"use client";

import { useState } from "react";
import { ROLE_CONFIGS, type UserRole, type useUserRole } from "@/hooks/useUserRole";

type Props = {
  onSelect: (role: UserRole) => void;
  onDismiss: () => void;
};

export function RoleOnboarding({ onSelect, onDismiss }: Props) {
  const [hovered, setHovered] = useState<UserRole | null>(null);

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center p-4"
      style={{ background: "rgba(11,27,51,0.65)", backdropFilter: "blur(6px)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Tell us who you are"
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-rule bg-surface-elev shadow-[var(--shadow-card-hover)]"
        style={{ maxHeight: "92dvh", overflowY: "auto" }}
      >
        {/* Header */}
        <div className="border-b border-rule px-6 py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
                Startup State Atlas
              </p>
              <h2 className="mt-1 font-display text-[22px] font-semibold leading-tight text-ink">
                What brings you here?
              </h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-mute">
                We'll personalize your experience based on your role.
              </p>
            </div>
            <button
              type="button"
              onClick={onDismiss}
              className="shrink-0 rounded-full p-1.5 text-ink-mute hover:text-ink"
              aria-label="Skip personalization"
            >
              <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none">
                <path
                  d="M3 3l10 10M13 3L3 13"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Role grid */}
        <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3">
          {ROLE_CONFIGS.map((cfg) => (
            <button
              key={cfg.id}
              type="button"
              id={`role-onboarding-${cfg.id}`}
              onMouseEnter={() => setHovered(cfg.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelect(cfg.id)}
              className={`group flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all duration-150 ${
                hovered === cfg.id
                  ? "border-accent bg-accent-soft/50 shadow-md"
                  : "border-rule bg-surface hover:border-rule-strong"
              }`}
            >
              <span className="text-[26px] leading-none" aria-hidden="true">
                {cfg.emoji}
              </span>
              <span className="font-semibold text-[14px] text-ink leading-tight">
                {cfg.label}
              </span>
              <span className="text-[11.5px] text-ink-mute leading-relaxed">
                {cfg.description}
              </span>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-rule px-5 py-3">
          <button
            type="button"
            onClick={onDismiss}
            className="text-[12px] text-ink-mute hover:text-ink"
          >
            Skip — browse without personalization
          </button>
        </div>
      </div>
    </div>
  );
}
