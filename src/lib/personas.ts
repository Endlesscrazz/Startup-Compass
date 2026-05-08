/**
 * Persona definitions for the dual-audience hero.
 * The same hero swaps headline, sub-copy, CTAs, and stats based on
 * who's looking — directly addressing the brief's "dual audience" requirement.
 */

export type PersonaKey = "founder" | "investor";

export type PersonaContent = {
  /** Label in the segmented switcher */
  label: string;
  /** Headline split for typographic control over the highlighted word */
  headline: {
    line1: string;
    line2Pre: string;
    highlight: string;
  };
  /** One-paragraph value prop, ~25 words */
  subcopy: string;
  /** Primary call-to-action (terracotta button) */
  primaryCta: { label: string; href: string };
  /** Secondary call-to-action (outline button) */
  secondaryCta: { label: string; href: string };
  /** Four trust-strip stats, persona-specific */
  stats: { value: string; label: string }[];
};

export const PERSONAS: Record<PersonaKey, PersonaContent> = {
  founder: {
    label: "I'm a founder",
    headline: {
      line1: "Built in Utah.",
      line2Pre: "Found in ",
      highlight: "seconds.",
    },
    subcopy:
      "Startup Compass is the official front door to Utah's startup ecosystem — for founders looking for what's next, and for the world looking at what we're building.",
    primaryCta: { label: "Find your resources", href: "/navigator" },
    secondaryCta: { label: "Explore the map", href: "/map" },
    stats: [
      { value: "100+", label: "State programs" },
      { value: "$0", label: "Cost to founders" },
      { value: "29", label: "Counties served" },
      { value: "1", label: "Front door" },
    ],
  },
  investor: {
    label: "I'm an investor",
    headline: {
      line1: "Utah's startup state,",
      line2Pre: "on ",
      highlight: "one map.",
    },
    subcopy:
      "Every Utah startup on one interactive map — filterable by sector, stage, and hiring. See what the West's most ambitious state is building, up close.",
    primaryCta: { label: "Explore the map", href: "/map" },
    secondaryCta: { label: "See state programs", href: "/navigator" },
    stats: [
      { value: "1,500+", label: "Companies" },
      { value: "12", label: "Sectors" },
      { value: "29", label: "Counties" },
      { value: "100%", label: "Self-service" },
    ],
  },
};

export const PERSONA_KEYS: PersonaKey[] = ["founder", "investor"];
