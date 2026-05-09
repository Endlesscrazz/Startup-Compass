import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { InvestorMapExplorer } from "@/components/InvestorMapExplorer";
import { NavigatorTabs } from "@/app/navigator/NavigatorTabs";
import { ResultsClient } from "@/app/results/ResultsClient";
import {
  getAtlasStats,
  getDatasetSourceLabels,
  getFeaturedCompany,
  getInitials,
  profileCompleteness,
} from "@/lib/atlas-data";

const heroImage =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=82";

type HeaderVariant = "landing" | "founder" | "search";

export function LandingAtlasPage() {
  const stats = getAtlasStats();
  const sources = getDatasetSourceLabels();

  return (
    <div className="atlas-page atlas-page-light">
      <AtlasHeader variant="landing" />
      <main>
        <section
          className="atlas-hero"
          style={{
            backgroundImage: `linear-gradient(90deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.94) 38%, rgba(255,255,255,0.38) 70%, rgba(255,255,255,0.08) 100%), url(${heroImage})`,
          }}
        >
          <div className="atlas-hero-copy">
            <h1>
              Invest in what
              <br />
              Utah is building.
            </h1>
            <p>
              Explore {stats[0].value} verified Utah startups by sector, stage,
              team size, and location. Founders can use the provided resource
              dataset to find programs, capital, communities, and support.
            </p>
            <div className="atlas-actions">
              <Link className="atlas-btn atlas-btn-primary" href="/search">
                Explore Startup Atlas
              </Link>
              <Link className="atlas-btn atlas-btn-ghost" href="/navigator">
                Find Founder Resources
              </Link>
              <Link className="atlas-btn atlas-btn-gold" href="/search">
                Claim My Startup
              </Link>
            </div>
          </div>
        </section>

        <section className="atlas-landing-map-card" aria-label="Utah atlas preview">
          <div className="atlas-searchbar">
            <label>
              <span className="atlas-search-icon" aria-hidden="true">
                <SearchIcon />
              </span>
              <input
                type="search"
                placeholder="Search startups, investors, sectors, or locations"
              />
            </label>
            <button className="atlas-filter-btn" type="button">
              <FilterIcon /> Filters
            </button>
          </div>
          <div className="atlas-preview-map atlas-preview-map-static">
            <div className="atlas-map-note">
              <strong>Utah Innovation. Global Impact.</strong>
              <span>
                Discover {stats[0].value} verified startups and {stats[1].value}{" "}
                founder resources across Utah.
              </span>
              <Link href="/search">Open live map</Link>
            </div>
            <div className="relative h-[min(360px,52vw)] w-full min-h-[220px] overflow-hidden rounded-xl">
              <Image
                src="/utah-map-preview.png"
                alt="Utah startup and investor map with clustered markers"
                fill
                className="object-cover object-center"
                sizes="(max-width: 1100px) 100vw, 960px"
                priority
              />
            </div>
          </div>
        </section>

        <section className="atlas-metrics" aria-label="Startup Compass stats">
          {stats.map((stat) => (
            <Metric
              key={stat.label}
              icon={<MetricIcon kind={stat.kind} />}
              value={stat.value}
              label={stat.label}
            />
          ))}
        </section>

        <section className="atlas-trust">
          <span>Powered by Utah startup map & resource datasets</span>
          <div>
            {sources.map((source) => (
              <strong key={source}>{source}</strong>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export function FounderCompassPage() {
  const company = getFeaturedCompany();
  const score = profileCompleteness(company);

  return (
    <div className="atlas-page atlas-page-light">
      <AtlasHeader variant="founder" />
      <main className="founder-shell">
        <p className="atlas-kicker">Founder Compass</p>
        <h1>Resources matched to your journey</h1>
        <p className="founder-subtitle">
          Rankings use embedding similarity, Utah county eligibility, and goal
          boosts — then short explanations. Take the quiz to run the same
          pipeline used at demo time.
        </p>

        <section className="founder-profile-card">
          <div className="founder-profile-main">
            <CompanyAvatar name={company.name} />
            <div>
              <h2>{company.name}</h2>
              <p>
                Example profile from the public startup map dataset
              </p>
              <div className="founder-tags">
                <span>{company.sector}</span>
                <span>{company.stage}</span>
                <span>{company.employees}</span>
                <span>{company.city}, UT</span>
              </div>
              <p className="founder-bio">
                {company.description ??
                  `${company.name} is part of the Utah startup map dataset.`}
              </p>
            </div>
          </div>
          <aside className="profile-strength">
            <h3>Dataset spotlight</h3>
            <div>
              <span className="strength-ring">{score}%</span>
              <p>
                <strong>{score >= 80 ? "Rich" : "Building"}</strong>
                Profile completeness in companies.json (illustrative only).
              </p>
            </div>
            <Link
              className="atlas-btn atlas-btn-primary mt-4 inline-flex w-full justify-center no-underline"
              href="/navigator"
            >
              Get my resource matches
            </Link>
          </aside>
        </section>

        <section className="founder-match-cta" aria-label="Navigator entry">
          <h2>Personalized matches</h2>
          <p>
            The 30-second intake captures stage, sector, location, and goals.
            Your profile is embedded once per request; resources are pre-vectorized
            from <code className="rounded bg-black/5 px-1">data/resources.json</code>.
          </p>
          <div className="founder-match-actions">
            <Link className="atlas-btn atlas-btn-primary" href="/navigator">
              Start founder navigator
            </Link>
            <Link className="atlas-btn atlas-btn-ghost" href="/search">
              Explore the investor map
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

export function SearchAtlasPage() {
  return (
    <div className="atlas-page atlas-page-dark atlas-search-live">
      <AtlasHeader variant="search" />
      <main className="search-shell atlas-search-shell-live">
        <InvestorMapExplorer variant="atlas" />
      </main>
    </div>
  );
}

export function NavigatorAtlasPage() {
  return (
    <div className="atlas-page atlas-page-light">
      <AtlasHeader variant="founder" />
      <main>
        <div style={{ borderBottom: "1px solid rgba(8,38,83,0.1)", padding: "2rem 1.5rem 1.75rem", textAlign: "center" }}>
          <h1 style={{ fontFamily: "var(--font-display), serif", fontSize: "clamp(1.7rem, 4vw, 2.4rem)", fontWeight: 700, color: "#062a52", lineHeight: 1.15 }}>
            Find your resources
          </h1>
          <p style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "#4a6080", maxWidth: "36rem", marginInline: "auto" }}>
            5–7 Utah programs matched to your situation · 30 seconds
          </p>
        </div>
        <NavigatorTabs />
      </main>
    </div>
  );
}

export function ResultsAtlasPage() {
  return (
    <div className="atlas-page atlas-page-light">
      <AtlasHeader variant="founder" />
      <main>
        <ResultsClient />
      </main>
    </div>
  );
}

function AtlasHeader({ variant }: { variant: HeaderVariant }) {
  const dark = variant === "search";
  const company = getFeaturedCompany();
  const nav =
    variant === "landing"
      ? [
          ["Map", "/search"],
          ["Founder match", "/navigator"],
          ["Compass", "/founder-compass"],
          ["Atlas home", "/"],
        ]
      : variant === "founder"
        ? [
            ["Founder Compass", "/founder-compass"],
            ["Navigator", "/navigator"],
            ["Investor map", "/search"],
            ["Home", "/"],
          ]
        : [
            ["Search", "/search"],
            ["Navigator", "/navigator"],
            ["Compass", "/founder-compass"],
            ["Home", "/"],
          ];

  return (
    <header className={`atlas-header ${dark ? "atlas-header-dark" : ""}`}>
      <Link className="atlas-brand" href="/">
        <MountainMark />
        <span>Startup Compass</span>
      </Link>
      <nav aria-label="Primary navigation">
        {nav.map(([label, href]) => (
          <Link
            key={label}
            href={href}
            className={isActiveNav(variant, label) ? "active" : undefined}
          >
            {label}
          </Link>
        ))}
      </nav>
      <div className="atlas-header-actions">
        {variant === "landing" && (
          <>
            <Link href="/founder-compass">Log in</Link>
            <Link className="signup" href="/founder-compass">Sign up</Link>
          </>
        )}
        {variant === "founder" && (
          <>
            <button type="button" aria-label="Notifications">
              <BellIcon />
            </button>
            <CompanyAvatar name={company.name} small />
          </>
        )}
        {variant === "search" && (
          <>
            <button type="button" className="investor-pill">
              {company.sector}
            </button>
            <CompanyAvatar name={company.name} small />
          </>
        )}
      </div>
    </header>
  );
}

function isActiveNav(variant: HeaderVariant, label: string) {
  return (
    (variant === "founder" && label === "Founder Compass") ||
    (variant === "search" && label === "Search") ||
    (variant === "landing" && label === "Atlas home")
  );
}

function Metric({
  icon,
  value,
  label,
}: {
  icon: ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="atlas-metric">
      {icon}
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

function MetricIcon({
  kind,
}: {
  kind: "startups" | "resources" | "cities" | "industries" | "topics";
}) {
  if (kind === "resources") return <RocketIcon />;
  if (kind === "cities") return <GlobeIcon />;
  if (kind === "industries") return <CapitalIcon />;
  if (kind === "topics") return <ShieldIcon />;
  return <InvestorIcon />;
}

function CompanyAvatar({ name, small = false }: { name: string; small?: boolean }) {
  return (
    <span className={`company-avatar ${small ? "company-avatar-small" : ""}`}>
      {getInitials(name)}
    </span>
  );
}

function MountainMark() {
  return (
    <svg viewBox="0 0 52 34" aria-hidden="true" className="mountain-mark">
      <path d="M4 29 L18 8 L26 19 L34 2 L49 29 Z" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      <path d="M15 29 L23 18 L28 23 L34 13 L42 29" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      <path d="M8 29 H48" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 18 18" aria-hidden="true">
      <circle cx="8" cy="8" r="5.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 12 L16 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 18 18" aria-hidden="true">
      <path d="M3 5 H15 M6 9 H12 M8 13 H10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M5.5 8.4 C5.5 5.6 7.3 3.5 10 3.5 C12.7 3.5 14.5 5.6 14.5 8.4 V11.8 L16 14 H4 L5.5 11.8 Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M8.2 15.3 C8.7 16.1 9.3 16.5 10 16.5 C10.7 16.5 11.3 16.1 11.8 15.3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true">
      <circle cx="14" cy="14" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M4 14 H24 M14 4 C10 8 10 20 14 24 M14 4 C18 8 18 20 14 24" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function CapitalIcon() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true">
      <path d="M9 22 H21 C23 22 24.5 20.4 24.5 18.4 C24.5 16.5 23 15 21.2 15 H20.8 C20.2 11.2 17.3 8.5 13.8 8.5 C10.8 8.5 8.2 10.4 7.2 13.3 C5.1 13.6 3.5 15.4 3.5 17.6 C3.5 20 5.4 22 9 22 Z" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M14 5 V10 M14 5 L11.5 7.5 M14 5 L16.5 7.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function InvestorIcon() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true">
      <circle cx="14" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M5.5 24 C6.8 18.8 9.7 16 14 16 C18.3 16 21.2 18.8 22.5 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function RocketIcon() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true">
      <path d="M13 19 L9 23 L7 21 L11 17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 18 C9 14 10 10 13 7 C16 4 21 3 24 4 C25 7 24 12 21 15 C18 18 14 19 10 18 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="18" cy="10" r="2" fill="currentColor" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true">
      <path d="M14 3 L23 7 V13 C23 19 19.5 23.3 14 25 C8.5 23.3 5 19 5 13 V7 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9.5 14 L12.5 17 L18.8 10.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

