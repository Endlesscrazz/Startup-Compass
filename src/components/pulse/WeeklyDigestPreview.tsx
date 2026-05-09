"use client";

import { useMemo } from "react";
import { COMPANIES } from "@/lib/map-config";
import { RESOURCES } from "@/lib/atlas-data";
import { buildWeeklyDigestPreview } from "@/lib/pulse/weeklyDigest";
import type { DigestRole } from "@/lib/pulse/weeklyDigest";
import { useUserRole, type UserRole } from "@/hooks/useUserRole";

function roleToDigest(role: UserRole | null): DigestRole {
  if (role === "investor") return "investor";
  if (role === "student") return "student";
  if (role === "job-seeker") return "job_seeker";
  return "founder";
}

export function WeeklyDigestPreview() {
  const { role, hydrated } = useUserRole();
  const digest = useMemo(
    () =>
      buildWeeklyDigestPreview({
        role: hydrated ? roleToDigest(role) : "founder",
        companies: COMPANIES,
        resources: RESOURCES,
      }),
    [role, hydrated],
  );

  return (
    <section className="rounded-2xl border border-rule bg-surface-elev p-5 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-mute">
        Weekly digest preview
      </p>
      <h3 className="mt-1 font-display text-[17px] font-semibold text-ink">
        What a digest could include
      </h3>
      <p className="mt-1 text-[12px] text-ink-mute">
        Generated from live map and resource data — email delivery can be wired later.
      </p>
      <ul className="mt-4 space-y-4">
        {digest.sections.map((s) => (
          <li key={s.id}>
            <p className="text-[13px] font-semibold text-ink">{s.title}</p>
            <ul className="mt-1.5 list-disc space-y-1 pl-4 text-[12px] text-ink-soft">
              {s.bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}
