"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
  type Variants,
} from "motion/react";
import { PERSONAS, type PersonaKey } from "@/lib/personas";
import { PersonaSwitcher } from "./PersonaSwitcher";

const EASE = [0.16, 1, 0.3, 1] as const;
const PANEL_ID = "hero-persona-panel";

const container: Variants = {
  hidden: { opacity: 1 },
  show: {
    transition: {
      staggerChildren: 0.09,
      delayChildren: 0.05,
    },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE },
  },
};

const swapTransition = { duration: 0.35, ease: EASE };

export function Hero() {
  const reduced = useReducedMotion();
  const initial = reduced ? "show" : "hidden";

  const [persona, setPersona] = useState<PersonaKey>("founder");
  const content = PERSONAS[persona];
  const { line1, line2Pre, highlight } = content.headline;

  return (
    <section className="topo relative overflow-hidden">
      {/* Decorative ridge — references Utah landscape without being literal */}
      <svg
        aria-hidden="true"
        viewBox="0 0 1440 200"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 w-full text-ink/[0.05]"
      >
        <path
          d="M0 160 L120 110 L240 140 L360 80 L500 130 L640 70 L780 120 L920 60 L1060 110 L1200 80 L1320 130 L1440 100 L1440 200 L0 200 Z"
          fill="currentColor"
        />
      </svg>

      <LayoutGroup>
        <motion.div
          initial={initial}
          animate="show"
          variants={container}
          className="relative mx-auto w-full max-w-6xl px-6 pt-20 pb-28 sm:px-8 sm:pt-28 sm:pb-36"
        >
          {/* Eyebrow — partnership credibility, never swaps */}
          <motion.div
            variants={item}
            className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.22em] text-ink-mute"
          >
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-utah-blue" />
            An initiative of the Utah Governor&rsquo;s Office of Economic
            Development
          </motion.div>

          {/* Persona switcher — the dual-audience proof point */}
          <motion.div variants={item} className="mt-6">
            <PersonaSwitcher
              value={persona}
              onChange={setPersona}
              panelId={PANEL_ID}
            />
          </motion.div>

          {/* Swappable content panel */}
          <div
            id={PANEL_ID}
            role="tabpanel"
            aria-labelledby={`persona-tab-${persona}`}
            className="mt-7"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={persona}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={reduced ? { duration: 0 } : swapTransition}
              >
                {/* Headline */}
                <h1 className="max-w-4xl font-display text-[44px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink sm:text-[64px] md:text-[76px]">
                  {line1}
                  <br />
                  <span className="text-ink">{line2Pre}</span>
                  <span className="relative inline-block text-ink">
                    <span className="relative z-10">{highlight}</span>
                    <motion.span
                      aria-hidden="true"
                      initial={reduced ? { scaleX: 1 } : { scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={
                        reduced
                          ? { duration: 0 }
                          : { duration: 0.6, ease: EASE, delay: 0.15 }
                      }
                      style={{ originX: 0 }}
                      className="absolute inset-x-0 bottom-1 -z-0 h-3 bg-gold-soft/50 sm:bottom-2 sm:h-4"
                    />
                  </span>
                </h1>

                {/* Sub-copy */}
                <p className="mt-7 max-w-2xl text-lg leading-relaxed text-ink-soft sm:text-xl">
                  {content.subcopy}
                </p>

                {/* CTAs */}
                <div className="mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
                  <Link
                    href={content.primaryCta.href}
                    className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-utah-blue px-6 text-[15px] font-medium text-white shadow-[0_8px_24px_-8px_rgba(184,84,42,0.55)] transition-all hover:bg-utah-blue-hover hover:shadow-[0_12px_28px_-8px_rgba(184,84,42,0.65)]"
                  >
                    {content.primaryCta.label}
                    <svg
                      className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                      viewBox="0 0 16 16"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M3 8h10m0 0L9 4m4 4l-4 4"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Link>
                  <Link
                    href={content.secondaryCta.href}
                    className="group inline-flex h-12 items-center justify-center gap-2 rounded-full border border-ink/15 bg-surface-elev px-6 text-[15px] font-medium text-ink transition-colors hover:border-ink/30 hover:bg-white"
                  >
                    {content.secondaryCta.label}
                  </Link>
                </div>

                {/* Trust strip — also persona-specific */}
                <dl className="mt-16 grid max-w-3xl grid-cols-2 gap-x-8 gap-y-6 border-t border-rule/70 pt-8 sm:grid-cols-4">
                  {content.stats.map((stat) => (
                    <div key={stat.label}>
                      <dt className="font-display text-3xl font-semibold tracking-tight text-ink">
                        {stat.value}
                      </dt>
                      <dd className="mt-1 text-[13px] uppercase tracking-[0.14em] text-ink-mute">
                        {stat.label}
                      </dd>
                    </div>
                  ))}
                </dl>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </LayoutGroup>
    </section>
  );
}
