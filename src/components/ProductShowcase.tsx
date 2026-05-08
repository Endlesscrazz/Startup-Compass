"use client";

import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "motion/react";

const EASE = [0.16, 1, 0.3, 1] as const;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: EASE },
  },
};

const cardsContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.05 },
  },
};

const cardItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: EASE },
  },
};

export function ProductShowcase() {
  const reduced = useReducedMotion();
  const initial = reduced ? "show" : "hidden";

  return (
    <section
      id="products"
      className="relative scroll-mt-24 bg-surface-elev py-24 sm:py-28"
    >
      <div className="mx-auto w-full max-w-6xl px-6 sm:px-8">
        <motion.div
          initial={initial}
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          variants={fadeUp}
          className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end"
        >
          <div className="max-w-2xl">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-accent">
              Two products. One platform.
            </p>
            <h2 className="mt-4 font-display text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl">
              One door for founders.
              <br />
              One window for the world.
            </h2>
          </div>
          <p className="max-w-md text-base leading-relaxed text-ink-soft">
            Whether you&rsquo;re building your first company or sizing up
            Utah&rsquo;s ecosystem from across the world, you start here.
          </p>
        </motion.div>

        <motion.div
          initial={initial}
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={cardsContainer}
          className="mt-14 grid gap-6 lg:grid-cols-2 lg:gap-8"
        >
          <ProductCard
            tag="For founders"
            title="The Founder's Navigator"
            description="A personalized guide to every state program, dollar, and mentor — tailored to where you are and where you're going. No more browsing a library when you need a librarian."
            features={[
              "Personalized in under two minutes",
              "Every state resource, in one place",
              "Updated as new programs launch",
            ]}
            ctaHref="/navigator"
            ctaLabel="Find your resources"
            artwork={<NavigatorArtwork />}
          />
          <ProductCard
            tag="For the ecosystem"
            title="The Utah Startup Map"
            description="Every company being built in Utah, on one interactive map. Founders find partners and customers. Investors see the state of the state. Companies tell their own story."
            features={[
              "Self-service company profiles",
              "Filter by sector, stage, hiring",
              "Built for investors, useful for founders",
            ]}
            ctaHref="/map"
            ctaLabel="Explore the map"
            artwork={<MapArtwork />}
          />
        </motion.div>

        <motion.div
          initial={initial}
          whileInView="show"
          viewport={{ once: true, amount: 0.6 }}
          variants={fadeUp}
          className="mt-16 flex flex-col items-start gap-3 border-t border-rule/70 pt-8 text-sm text-ink-mute sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="leading-relaxed">
            A non-commercial public good operated in partnership with the{" "}
            <a
              href="https://goed.utah.gov"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink underline-offset-4 hover:underline"
            >
              Utah Governor&rsquo;s Office of Economic Development
            </a>
            .
          </p>
          <a
            href="https://startup.utah.gov"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-ink hover:text-accent"
          >
            Learn about the Startup State
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M5 3h8v8M13 3L4 12"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  );
}

type ProductCardProps = {
  tag: string;
  title: string;
  description: string;
  features: string[];
  ctaHref: string;
  ctaLabel: string;
  artwork: React.ReactNode;
};

function ProductCard({
  tag,
  title,
  description,
  features,
  ctaHref,
  ctaLabel,
  artwork,
}: ProductCardProps) {
  return (
    <motion.article
      variants={cardItem}
      className="group relative flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-rule/80 bg-surface-tint/40 transition-all hover:-translate-y-0.5 hover:border-rule-strong hover:shadow-[var(--shadow-card-hover)]"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden border-b border-rule/80 bg-surface">
        {artwork}
      </div>

      <div className="flex flex-1 flex-col p-7 sm:p-8">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-ink/5 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-ink-soft">
          <span className="inline-flex h-1 w-1 rounded-full bg-accent" />
          {tag}
        </span>

        <h3 className="mt-5 font-display text-2xl font-semibold leading-tight tracking-tight text-ink sm:text-3xl">
          {title}
        </h3>

        <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
          {description}
        </p>

        <ul className="mt-6 space-y-2.5">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-3 text-[14px] text-ink-soft">
              <svg
                className="mt-1 h-3.5 w-3.5 shrink-0 text-accent"
                viewBox="0 0 14 14"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M2 7.5L5.5 11L12 3.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {feature}
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-8">
          <Link
            href={ctaHref}
            className="group/cta inline-flex items-center gap-2 text-[15px] font-medium text-ink hover:text-accent"
          >
            {ctaLabel}
            <span
              aria-hidden="true"
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-ink/15 transition-all group-hover/cta:border-accent group-hover/cta:bg-accent group-hover/cta:text-white"
            >
              <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
                <path
                  d="M2 6h8m0 0L7 3m3 3l-3 3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </Link>
        </div>
      </div>
    </motion.article>
  );
}

/* ---------------- Artwork ---------------- */

function NavigatorArtwork() {
  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0 bg-gradient-to-br from-surface to-surface-tint/60" />
      <div className="absolute inset-0 flex flex-col items-stretch justify-center gap-2.5 px-8">
        <div className="flex h-9 items-center gap-2.5 rounded-full border border-rule bg-surface-elev px-4 shadow-[0_2px_8px_-4px_rgba(11,27,51,0.15)]">
          <svg
            className="h-3.5 w-3.5 text-ink-mute"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M9 9l3 3"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <span className="text-[12px] text-ink-mute">
            B2B SaaS · 18 months in · raising
          </span>
          <span className="ml-auto h-2 w-2 rounded-full bg-accent" />
        </div>
        <ResultRow tagColor="bg-accent" label="Angel Group · Park City" weight="80%" />
        <ResultRow tagColor="bg-ink" label="SBIR Match Program · GOED" weight="64%" />
        <ResultRow tagColor="bg-ink-soft" label="University of Utah Lassonde" weight="51%" />
      </div>
    </div>
  );
}

function ResultRow({
  label,
  weight,
  tagColor,
}: {
  label: string;
  weight: string;
  tagColor: string;
}) {
  return (
    <div className="flex h-9 items-center gap-2.5 rounded-lg border border-rule/80 bg-surface-elev/95 px-3 shadow-[0_1px_3px_-1px_rgba(11,27,51,0.08)]">
      <span className={`h-2 w-2 shrink-0 rounded-full ${tagColor}`} />
      <span className="truncate text-[12px] text-ink-soft">{label}</span>
      <span className="ml-auto font-mono text-[11px] text-ink-mute">{weight}</span>
    </div>
  );
}

function MapArtwork() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-ink">
      <svg
        className="absolute inset-0 h-full w-full text-white/[0.06]"
        viewBox="0 0 320 180"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id="grid"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M20 0L0 0 0 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="320" height="180" fill="url(#grid)" />
        <path
          d="M90 35 L210 35 L210 60 L240 60 L240 145 L120 145 L120 130 L90 130 Z"
          fill="rgba(255,255,255,0.04)"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="1"
        />
      </svg>

      <Pin x="38%" y="42%" hue="accent" pulse />
      <Pin x="48%" y="38%" hue="white" />
      <Pin x="55%" y="46%" hue="white" />
      <Pin x="44%" y="54%" hue="white" />
      <Pin x="62%" y="60%" hue="accent" />
      <Pin x="36%" y="68%" hue="white" />
      <Pin x="58%" y="72%" hue="white" />
      <Pin x="70%" y="50%" hue="white" />

      <div className="absolute right-5 top-5 hidden rounded-lg border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-sm sm:block">
        <div className="text-[10px] uppercase tracking-[0.16em] text-white/50">
          Hiring · Series A
        </div>
        <div className="mt-0.5 text-[12px] font-medium text-white">
          Acme Robotics &middot; Lehi
        </div>
      </div>
    </div>
  );
}

function Pin({
  x,
  y,
  hue,
  pulse = false,
}: {
  x: string;
  y: string;
  hue: "accent" | "white";
  pulse?: boolean;
}) {
  const dotClass =
    hue === "accent"
      ? "bg-accent ring-accent/40"
      : "bg-white ring-white/30";
  return (
    <span
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: x, top: y }}
      aria-hidden="true"
    >
      {pulse && (
        <span
          className={`absolute inset-0 -m-2 rounded-full ${
            hue === "accent" ? "bg-accent/40" : "bg-white/30"
          } animate-ping`}
        />
      )}
      <span className={`relative block h-2 w-2 rounded-full ring-4 ${dotClass}`} />
    </span>
  );
}
