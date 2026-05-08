"use client";

import { motion, useReducedMotion } from "motion/react";
import { useRef, type KeyboardEvent } from "react";
import {
  PERSONAS,
  PERSONA_KEYS,
  type PersonaKey,
} from "@/lib/personas";

type Props = {
  value: PersonaKey;
  onChange: (next: PersonaKey) => void;
  /** id of the panel this switcher controls (for aria-controls) */
  panelId: string;
};

/**
 * A two-state pill segmented control for the hero persona switcher.
 * Implements the WAI-ARIA Tabs pattern (manual activation):
 * - role="tablist" with role="tab" buttons
 * - aria-selected reflects state
 * - ArrowLeft/ArrowRight move focus AND activate
 * - Home/End jump to first/last
 *
 * The active indicator slides between options via shared layoutId,
 * which respects prefers-reduced-motion automatically.
 */
export function PersonaSwitcher({ value, onChange, panelId }: Props) {
  const reduced = useReducedMotion();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const activate = (next: PersonaKey, index: number) => {
    onChange(next);
    tabRefs.current[index]?.focus();
  };

  const handleKey = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = PERSONA_KEYS.length - 1;
    let nextIndex: number | null = null;

    if (e.key === "ArrowRight") nextIndex = index === last ? 0 : index + 1;
    else if (e.key === "ArrowLeft") nextIndex = index === 0 ? last : index - 1;
    else if (e.key === "Home") nextIndex = 0;
    else if (e.key === "End") nextIndex = last;

    if (nextIndex !== null) {
      e.preventDefault();
      activate(PERSONA_KEYS[nextIndex], nextIndex);
    }
  };

  return (
    <div
      role="tablist"
      aria-label="Choose your view"
      className="inline-flex items-center gap-0.5 rounded-full bg-ink/[0.05] p-1 ring-1 ring-ink/[0.08]"
    >
      {PERSONA_KEYS.map((key, index) => {
        const isActive = value === key;
        return (
          <button
            key={key}
            id={`persona-tab-${key}`}
            ref={(el) => {
              tabRefs.current[index] = el;
            }}
            role="tab"
            type="button"
            aria-selected={isActive}
            aria-controls={panelId}
            tabIndex={isActive ? 0 : -1}
            onClick={() => activate(key, index)}
            onKeyDown={(e) => handleKey(e, index)}
            className="relative z-0 inline-flex h-9 items-center gap-2 rounded-full px-4 text-[13px] font-medium transition-colors"
          >
            {isActive && (
              <motion.span
                layoutId="persona-pill"
                aria-hidden="true"
                transition={
                  reduced
                    ? { duration: 0 }
                    : { type: "spring", duration: 0.45, bounce: 0.18 }
                }
                className="absolute inset-0 z-0 rounded-full bg-ink shadow-[0_4px_12px_-4px_rgba(11,27,51,0.35)]"
              />
            )}
            <span
              className={`relative z-10 transition-colors ${
                isActive ? "text-surface" : "text-ink-soft hover:text-ink"
              }`}
            >
              {PERSONAS[key].label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
