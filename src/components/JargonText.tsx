"use client";

import type { ReactNode } from "react";
import { jargonTooltip, STARTUP_JARGON } from "@/lib/jargon/terms";

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Renders plain text with subtle dotted underlines + native title tooltips for known jargon.
 */
export function JargonText({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const keys = Object.keys(STARTUP_JARGON).sort((a, b) => b.length - a.length);
  if (!text || keys.length === 0) {
    return <span className={className}>{text}</span>;
  }
  const pattern = new RegExp(`\\b(${keys.map(escapeRe).join("|")})\\b`, "gi");
  const parts: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  const re = new RegExp(pattern.source, pattern.flags);
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      parts.push(text.slice(last, m.index));
    }
    const raw = m[1] ?? m[0];
    const tip = jargonTooltip(raw);
    if (tip) {
      parts.push(
        <span
          key={`${m.index}-${raw}`}
          className="cursor-help border-b border-dotted border-ink/25"
          title={tip}
        >
          {m[0]}
        </span>,
      );
    } else {
      parts.push(m[0]);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <span className={className}>{parts.length ? parts : text}</span>;
}
