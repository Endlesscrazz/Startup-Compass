"use client";

import { useCallback, useEffect, useState } from "react";

const LS_KEY = "sc-user-role-v1";

export type UserRole =
  | "investor"
  | "founder"
  | "job-seeker"
  | "student"
  | "talent"
  | "economic-dev";

export interface RoleConfig {
  id: UserRole;
  label: string;
  emoji: string;
  description: string;
  heroHeadline: string;
  heroSubline: string;
  primaryCta: string;
  primaryHref: string;
  discoveryCta: string;
}

export const ROLE_CONFIGS: RoleConfig[] = [
  {
    id: "investor",
    label: "Investor",
    emoji: "💼",
    description: "I'm looking for investment opportunities in Utah startups",
    heroHeadline: "Find your next Utah portfolio company.",
    heroSubline:
      "Match your thesis to Utah's fastest-growing startups. Filter by stage, sector, hiring signals, and traction.",
    primaryCta: "Explore the map",
    primaryHref: "/search",
    discoveryCta: "Run thesis match",
  },
  {
    id: "founder",
    label: "Founder",
    emoji: "🚀",
    description: "I'm building a startup in Utah",
    heroHeadline: "Resources matched to your journey.",
    heroSubline:
      "Find grants, investors, mentors, and programs tailored to your stage and sector — in under 30 seconds.",
    primaryCta: "Find resources",
    primaryHref: "/navigator",
    discoveryCta: "Claim my startup",
  },
  {
    id: "job-seeker",
    label: "Job Seeker",
    emoji: "🔍",
    description: "I'm looking for a job at a Utah startup",
    heroHeadline: "Discover Utah startups worth joining.",
    heroSubline:
      "Explore companies that are actively hiring, growing fast, and building things that matter.",
    primaryCta: "Find hiring companies",
    primaryHref: "/search",
    discoveryCta: "Browse open roles",
  },
  {
    id: "student",
    label: "Student",
    emoji: "🎓",
    description: "I'm a student looking for internships or entry-level roles",
    heroHeadline: "Launch your career at a Utah startup.",
    heroSubline:
      "Find student-friendly startups, internships, and university-connected companies near your campus.",
    primaryCta: "Find student opportunities",
    primaryHref: "/search",
    discoveryCta: "Browse internships",
  },
  {
    id: "talent",
    label: "Relocating Talent",
    emoji: "🌐",
    description: "I'm considering moving to Utah for a startup career",
    heroHeadline: "Build your career in Utah.",
    heroSubline:
      "Utah's startup ecosystem is growing fast — outdoor lifestyle, lower cost of living, and serious tech companies.",
    primaryCta: "Explore companies",
    primaryHref: "/search",
    discoveryCta: "See why Utah",
  },
  {
    id: "economic-dev",
    label: "Economic Development",
    emoji: "🏛️",
    description: "I work in economic development or policy",
    heroHeadline: "Utah's startup ecosystem at a glance.",
    heroSubline:
      "Track sector growth, hiring signals, funding activity, and regional startup density across Utah.",
    primaryCta: "View ecosystem data",
    primaryHref: "/search",
    discoveryCta: "See weekly pulse",
  },
];

function load(): UserRole | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    return raw ? (raw as UserRole) : null;
  } catch {
    return null;
  }
}

function persist(role: UserRole | null) {
  try {
    if (role) {
      window.localStorage.setItem(LS_KEY, role);
    } else {
      window.localStorage.removeItem(LS_KEY);
    }
  } catch {
    /* ignore quota */
  }
}

export function useUserRole() {
  const [role, setRoleState] = useState<UserRole | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const saved = load();
    setRoleState(saved);
    setHydrated(true);
    // Show onboarding only on first visit (no role stored)
    if (!saved) {
      // Small delay so the page renders first
      const t = window.setTimeout(() => setShowOnboarding(true), 800);
      return () => window.clearTimeout(t);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const setRole = useCallback((r: UserRole) => {
    setRoleState(r);
    persist(r);
    setShowOnboarding(false);
  }, []);

  const clearRole = useCallback(() => {
    setRoleState(null);
    persist(null);
  }, []);

  const dismissOnboarding = useCallback(() => {
    setShowOnboarding(false);
  }, []);

  const config = role
    ? (ROLE_CONFIGS.find((c) => c.id === role) ?? null)
    : null;

  return {
    role,
    config,
    hydrated,
    showOnboarding,
    setRole,
    clearRole,
    dismissOnboarding,
    hasSelected: role !== null,
  };
}
