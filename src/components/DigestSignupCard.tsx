"use client";

import { useState } from "react";
import { ROLE_CONFIGS, type UserRole } from "@/hooks/useUserRole";

type Props = {
  onSubscribe: (email: string, role: UserRole | null) => void;
};

export function DigestSignupCard({ onSubscribe }: Props) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    onSubscribe(email.trim(), role);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border border-rule bg-surface-elev p-5 text-center shadow-[var(--shadow-card)]">
        <div className="text-[36px]">📬</div>
        <h3 className="mt-2 font-display text-[17px] font-semibold text-ink">
          You're subscribed!
        </h3>
        <p className="mt-1 text-[13px] text-ink-mute">
          We'll send your personalized Utah Startup Pulse weekly.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-rule bg-surface-elev p-5 shadow-[var(--shadow-card)]">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-accent">
        Stay informed
      </p>
      <h3 className="mt-1 font-display text-[18px] font-semibold text-ink">
        Utah Startup Pulse
      </h3>
      <p className="mt-1.5 text-[13px] leading-relaxed text-ink-mute">
        Get a weekly digest of hiring companies, new startups, funding signals,
        and resources — personalized to your role.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-rule bg-surface px-3 py-2.5 text-[14px] text-ink placeholder:text-ink-mute focus:border-accent focus:outline-none"
        />

        <div>
          <p className="mb-2 text-[11px] text-ink-mute">
            I'm interested in (optional):
          </p>
          <div className="flex flex-wrap gap-1.5">
            {ROLE_CONFIGS.map((cfg) => (
              <button
                key={cfg.id}
                type="button"
                onClick={() => setRole(role === cfg.id ? null : cfg.id)}
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  role === cfg.id
                    ? "border-accent bg-accent-soft text-ink"
                    : "border-rule bg-surface text-ink-soft hover:border-accent"
                }`}
              >
                <span aria-hidden="true">{cfg.emoji}</span>
                {cfg.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full rounded-full bg-ink py-2.5 text-[13px] font-medium text-surface hover:bg-ink-soft"
        >
          Subscribe to Weekly Pulse
        </button>
      </form>
    </div>
  );
}
