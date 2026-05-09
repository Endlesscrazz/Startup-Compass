import Link from "next/link";
import {
  getAtlasStats,
  getCityClusters,
  getCompanyFacts,
  getDatasetSourceLabels,
  getEmployeeFilterValue,
  getFeaturedCompany,
  getInitials,
  getProfileLevel,
  getResourceRecommendations,
  getSectorFilterSummaries,
  getSignalOptions,
  getStageFilterOptions,
  profileCompleteness,
  formatDomain,
} from "@/lib/atlas-data";
import { COMPANIES } from "@/lib/map-config";

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
              <Link className="atlas-btn atlas-btn-ghost" href="/founder-compass">
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
          <div className="atlas-preview-map">
            <div className="atlas-map-note">
              <strong>Utah Innovation. Global Impact.</strong>
              <span>
                Discover {stats[0].value} verified startups and {stats[1].value}{" "}
                founder resources across Utah.
              </span>
              <Link href="/search">View Map</Link>
            </div>
            <LightUtahMap />
            <div className="atlas-zoom-control" aria-label="Map zoom controls">
              <button type="button" aria-label="Zoom in">
                +
              </button>
              <button type="button" aria-label="Zoom out">
                -
              </button>
            </div>
          </div>
        </section>

        <section className="atlas-metrics" aria-label="Startup State Atlas stats">
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
          <span>Powered by the provided Builder Day datasets</span>
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
  const recommendations = getResourceRecommendations(company, 3);

  return (
    <div className="atlas-page atlas-page-light">
      <AtlasHeader variant="founder" />
      <main className="founder-shell">
        <p className="atlas-kicker">Founder Compass</p>
        <h1>Recommendations for You</h1>
        <p className="founder-subtitle">
          Personalized AI-sourced and connection-led to help you grow.
        </p>

        <section className="founder-profile-card">
          <div className="founder-profile-main">
            <CompanyAvatar name={company.name} />
            <div>
              <h2>{company.name}</h2>
              <p>
                Startup profile <span>{company.displayType ?? "profile"}</span>
              </p>
              <div className="founder-tags">
                <span>{company.sector}</span>
                <span>{company.stage}</span>
                <span>{company.employees}</span>
                <span>{company.city}, UT</span>
              </div>
              <p className="founder-bio">
                {company.description ??
                  `${company.name} is part of the provided Utah startup map dataset.`}
              </p>
            </div>
          </div>
          <aside className="profile-strength">
            <h3>Profile Strength</h3>
            <div>
              <span className="strength-ring">{score}%</span>
              <p>
                <strong>{score >= 80 ? "Strong" : "Building"}</strong>
                Resource matches are scored from the supplied resource dataset.
              </p>
            </div>
            <button type="button">Improve Profile</button>
          </aside>
        </section>

        <section className="founder-controls" aria-label="Recommendation filters">
          <ControlField label="Location" value={company.city} />
          <ControlField label="Stage" value={company.stage} />
          <ControlField label="Sector" value={company.sector} />
          <ControlField label="Size" value={company.employees} />
          <ControlField label="Sort" value="Resource fit" />
          <button type="button" className="founder-clear">
            Clear Filters
          </button>
        </section>

        <section className="match-list">
          <div className="match-list-head">
            <h2>Top Matches for You</h2>
            <button type="button">Why these matches?</button>
          </div>
          {recommendations.map((recommendation, index) => (
            <MatchRow
              key={recommendation.resource.id}
              rank={`${index + 1}`}
              title={recommendation.resource.title}
              tags={recommendation.tags}
              description={
                recommendation.resource.description ??
                "Resource description was not included in the provided CSV."
              }
              why={recommendation.reasons.join(" / ")}
              fitLabel={recommendation.fitLabel}
              score={`${recommendation.score}%`}
              tone={index === 1 ? "gold" : "blue"}
              href={recommendation.resource.link}
            />
          ))}
          <Link className="founder-all-link" href="/search">
            Explore all resources <span aria-hidden="true">-&gt;</span>
          </Link>
        </section>
      </main>
    </div>
  );
}

export function SearchAtlasPage() {
  const company = getFeaturedCompany();
  const score = profileCompleteness(company);
  const domain = formatDomain(company.website);
  const facts = getCompanyFacts(company);
  const sectorSummary = getSectorFilterSummaries().join(", ");
  const clusterCount = getCityClusters().length;

  return (
    <div className="atlas-page atlas-page-dark">
      <AtlasHeader variant="search" />
      <main className="search-shell">
        <aside className="search-sidebar">
          <h1>Find Startups & Investors</h1>
          <label className="dark-search">
            <SearchIcon />
            <input type="search" placeholder="Search by name, keyword..." />
          </label>
          <div className="filter-title-row">
            <span>Filters</span>
            <button type="button">Clear all</button>
          </div>
          <DarkFilterGroup
            title="Stage / Round"
            options={getStageFilterOptions()}
          />
          <DarkSlider title="Company Size / Employees" value={getEmployeeFilterValue()} />
          <DarkCollapsed title="Sectors" value={sectorSummary} />
          <DarkCollapsed title="Locations" value={`${clusterCount} mapped city clusters`} />
          <DarkFilterGroup
            title="Signals"
            options={getSignalOptions()}
          />
          <div className="completeness-filter">
            <span>Profile Completeness</span>
            <div>
              <Stars /> <strong>80%+</strong>
            </div>
          </div>
          <div className="search-sidebar-foot">
            <span>{COMPANIES.length.toLocaleString()} results</span>
            <button type="button">Reset map</button>
          </div>
        </aside>

        <section className="dark-map-panel" aria-label="Utah startup search map">
          <DarkNetworkMap />
          <div className="map-toolbar">
            <button type="button" aria-label="Zoom in">+</button>
            <button type="button" aria-label="Zoom out">-</button>
            <button type="button" aria-label="Locate me">
              <LocateIcon />
            </button>
          </div>
          <div className="map-legend">
            <span><b className="legend-blue" /> Cluster</span>
            <span><b className="legend-ice" /> Pre-Seed</span>
            <span><b className="legend-yellow" /> Seed</span>
            <span><b className="legend-orange" /> Series A</span>
            <span><b className="legend-red" /> Series B+</span>
          </div>
        </section>

        <aside className="company-panel">
          <button className="company-close" type="button" aria-label="Close profile">
            x
          </button>
          <div className="company-logo">
            <CompanyLogo name={company.name} />
          </div>
          <h2>{company.name}</h2>
          <p>
            {company.description ??
              `${company.name} is included in the provided Utah startup map dataset.`}
          </p>
          <div className="company-links">
            {company.website && <a href={company.website}>{domain}</a>}
            {company.linkedin && <a href={company.linkedin}>LinkedIn</a>}
          </div>
          <dl className="company-facts">
            {facts.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <div className="company-score">
            <span>Profile Completeness</span>
            <div>
              <strong>{getProfileLevel(score)}</strong>
              <b>{score}%</b>
            </div>
          </div>
          <Stars />
          {company.address && <p className="company-address">{company.address}</p>}
          <button type="button" className="panel-btn panel-btn-gold">
            Save to Shortlist
          </button>
          <button type="button" className="panel-btn panel-btn-red">
            Request Intro
          </button>
          <button type="button" className="panel-btn panel-btn-outline">
            View Full Profile
          </button>
        </aside>
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
          ["Search", "/search"],
          ["Investors", "/search"],
          ["Resources", "/founder-compass"],
          ["Ecosystem", "/"],
          ["About", "/"],
        ]
      : variant === "founder"
        ? [
            ["Founder Compass", "/founder-compass"],
            ["Resources", "/founder-compass"],
            ["Programs", "/founder-compass"],
            ["Events", "/founder-compass"],
            ["Success Stories", "/founder-compass"],
          ]
        : [
            ["Search", "/search"],
            ["Filters", "/search"],
            ["Investor Shortlists", "/search"],
            ["Founder Shortlists", "/search"],
            ["Claims / Add Company", "/search"],
          ];

  return (
    <header className={`atlas-header ${dark ? "atlas-header-dark" : ""}`}>
      <Link className="atlas-brand" href="/">
        <MountainMark />
        <span>Startup State Atlas</span>
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
    (variant === "search" && label === "Search")
  );
}

function Metric({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
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

function CompanyLogo({ name }: { name: string }) {
  return (
    <>
      <MountainMark />
      <strong>{getInitials(name)}</strong>
    </>
  );
}

function ControlField({ label, value }: { label: string; value: string }) {
  return (
    <label className="control-field">
      <span>{label}</span>
      <select defaultValue={value}>
        <option>{value}</option>
      </select>
    </label>
  );
}

function MatchRow({
  rank,
  title,
  tags,
  description,
  why,
  fitLabel,
  score,
  tone,
  href,
}: {
  rank: string;
  title: string;
  tags: string[];
  description: string;
  why: string;
  fitLabel: string;
  score: string;
  tone: "blue" | "gold";
  href: string | null;
}) {
  const shortDescription = truncateText(description, 180);
  const shortWhy = truncateText(why, 125);

  return (
    <article className="match-row">
      <span className={`match-rank ${tone}`}>{rank}</span>
      <div className="match-body">
        <h3>{title}</h3>
        <div className="match-tags">
          {tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <p>{shortDescription}</p>
        <small>Why it&apos;s a match: {shortWhy}</small>
      </div>
      <div className="match-score">
        <span className={tone}>{fitLabel}</span>
        <strong>{score}</strong>
      </div>
      {href ? (
        <a href={href} className="match-primary">
          View Details
        </a>
      ) : (
        <button type="button" className="match-primary">
          View Details
        </button>
      )}
      <button type="button" className="match-save">
        Save
      </button>
    </article>
  );
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  const trimmed = value.slice(0, maxLength - 1).trimEnd();
  return `${trimmed.replace(/[,.]$/, "")}...`;
}

function DarkFilterGroup({
  title,
  options,
}: {
  title: string;
  options: [string, boolean, string?][];
}) {
  return (
    <fieldset className="dark-filter-group">
      <legend>{title}</legend>
      {options.map(([label, checked, count]) => (
        <label key={label}>
          <input type="checkbox" defaultChecked={checked} />
          <span>{label}</span>
          {count && <b>{count}</b>}
        </label>
      ))}
    </fieldset>
  );
}

function DarkSlider({ title, value }: { title: string; value: string }) {
  const sliderValue =
    value === "Unknown" ? 1 : Math.min(100, Math.max(1, Number(value.match(/\d+/)?.[0] ?? 1)));

  return (
    <div className="dark-slider">
      <span>{title}</span>
      <strong>{value}</strong>
      <input type="range" min="1" max="100" defaultValue={sliderValue} />
    </div>
  );
}

function DarkCollapsed({ title, value }: { title: string; value: string }) {
  return (
    <button type="button" className="dark-collapsed">
      <span>
        <b>{title}</b>
        {value}
      </span>
      <ChevronDownIcon />
    </button>
  );
}

function Stars() {
  return <span className="stars" aria-label="Five star profile rating">★★★★★</span>;
}

function LightUtahMap() {
  const pins = getCityClusters(6);

  return (
    <div className="light-utah-map" aria-hidden="true">
      <svg viewBox="0 0 680 320" preserveAspectRatio="none">
        <path d="M110 32 C180 80 186 138 244 152 C313 168 324 106 381 116 C438 126 430 212 500 230 C548 242 584 216 626 276" />
        <path d="M275 0 C306 60 310 114 350 160 C382 198 430 220 462 320" />
        <path d="M24 250 C105 214 169 224 238 230 C304 238 391 282 468 258" />
        <path d="M170 70 C234 102 255 190 250 310" />
      </svg>
      {pins.map((pin, index) => (
        <span
          key={pin.city}
          className={`map-pin ${index === 1 ? "orange" : "blue"}`}
          style={{ left: pin.left, top: pin.top }}
        >
          <b>{pin.count}</b>
          <em>{pin.city}</em>
        </span>
      ))}
    </div>
  );
}

function DarkNetworkMap() {
  const bubbles = getCityClusters(9);

  return (
    <div className="dark-network-map">
      <svg viewBox="0 0 820 760" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#75b7ff" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#0d2d62" stopOpacity="0" />
          </radialGradient>
        </defs>
        <path className="network-state" d="M178 10 L572 42 L724 202 L658 728 L204 744 L96 566 Z" />
        <path className="network-road main" d="M224 12 C260 122 306 198 320 282 C340 412 312 538 244 744" />
        <path className="network-road main" d="M128 652 C224 548 278 454 326 306 C372 156 446 92 572 42" />
        <path className="network-road" d="M194 104 C284 160 400 142 508 96" />
        <path className="network-road" d="M282 290 C404 320 488 256 650 212" />
        <path className="network-road" d="M330 414 C426 430 490 514 610 612" />
        <path className="network-road" d="M174 600 C310 566 452 580 654 720" />
        {Array.from({ length: 82 }, (_, index) => {
          const x = (index * 73) % 760 + 30;
          const y = (index * 137) % 700 + 22;
          return <circle key={index} cx={x} cy={y} r={index % 7 === 0 ? 3 : 1.8} />;
        })}
      </svg>
      {bubbles.map((bubble) => (
        <span
          key={bubble.city}
          className="cluster-bubble"
          style={{ left: bubble.left, top: bubble.top }}
        >
          <b>{bubble.count}</b>
          <em>{bubble.city}</em>
        </span>
      ))}
    </div>
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

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M4 6 L8 10 L12 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LocateIcon() {
  return (
    <svg viewBox="0 0 18 18" aria-hidden="true">
      <circle cx="9" cy="9" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="9" cy="9" r="1.8" fill="currentColor" />
      <path d="M9 1.8 V4 M9 14 V16.2 M1.8 9 H4 M14 9 H16.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
