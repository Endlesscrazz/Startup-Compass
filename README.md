# Startup Compass

> **The official front door to Utah's startup ecosystem** — built for the Utah Governor's Office of Economic Development.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com)

A full-stack platform with semantic AI matching, an interactive startup map, AI-powered agents, company intelligence, and investor tools — all built for Utah's entrepreneurial ecosystem.

---

## Table of Contents

- [Products](#products)
- [Features at a Glance](#features-at-a-glance)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Data Pipeline](#data-pipeline)
- [AI & Agent System](#ai--agent-system)
- [Design System](#design-system)
- [Deployment](#deployment)

---

## Products

| Product | Route | Description |
|---|---|---|
| **Landing Page** | `/` | Public entry point with animated persona switcher |
| **Founder's Navigator** | `/navigator` → `/results` | Personalized resource matching via quiz or natural language |
| **Utah Startup Map** | `/map` | Interactive Leaflet + OpenStreetMap of every Utah company |
| **AI Agents Hub** | `/agents` | Three specialized AI agents for founders, investors, and job hunters |
| **Dashboard** | `/dashboard` | Personalized user dashboard |
| **Ecosystem Pulse** | `/pulse` | Weekly digest of startup ecosystem changes |
| **Investor Watchlist** | `/watchlist` | Track companies, set alerts, get briefs |
| **Admin Console** | `/admin` | Resource management and intelligence monitoring |

---

## Features at a Glance

<details>
<summary><strong>Founder's Navigator</strong> — Semantic resource matching</summary>

- 4-step intake quiz: stage → sector → city → goal
- Natural language description path ("just tell us what you need")
- Gemini `text-embedding-004` embeddings + in-memory cosine similarity (~1ms)
- Hard location filter + multiplicative topic/industry/community boosts
- Groq LLM-generated personalized explanations for top results
- 211 GOED resources pre-indexed at build time

**Key files:** [`src/lib/recommendation/`](src/lib/recommendation/), [`src/lib/embed.ts`](src/lib/embed.ts), [`src/lib/explain.ts`](src/lib/explain.ts), [`src/app/api/match/`](src/app/api/match/)
</details>

<details>
<summary><strong>Utah Startup Map</strong> — Interactive company explorer</summary>

- Leaflet + OpenStreetMap, 213+ Utah companies
- Filter by sector, stage, employee count, and free-text search
- Company detail drawer with full profile
- Investor watchlist integration (pin companies directly from the map)
- Marker clustering for dense city areas
- City centroid + deterministic jitter (instant, no geocoding API)

**Key files:** [`src/components/map/`](src/components/map/), [`src/lib/map-config.ts`](src/lib/map-config.ts), [`src/data/companies.json`](src/data/companies.json)
</details>

<details>
<summary><strong>AI Agents</strong> — Three specialized agents</summary>

| Agent | Route | Purpose |
|---|---|---|
| Founder Advisor | `/agents/founder-advisor` | Contextual startup guidance, action plans |
| Investor Thesis | `/agents/investor-thesis` | Investment thesis analysis & fit scoring |
| Job Hunter | `/agents/job-hunter` | Opportunity matching for job seekers |

- Backed by Anthropic Claude (`claude-sonnet-4-6`) and Groq (`llama-3.3-70b`)
- Agent state management with streaming responses
- Gmail integration for automated outreach drafts

**Key files:** [`src/lib/agents/`](src/lib/agents/), [`src/app/api/agents/`](src/app/api/agents/)
</details>

<details>
<summary><strong>Company Intelligence & Briefs</strong> — Automated monitoring</summary>

- Change detection: new funding rounds, hiring signals, product launches
- Brief generation (AI-written summaries per company or watchlist)
- Delivery via Gmail or SMS (Twilio)
- Weekly digest (`/pulse`) with ecosystem-wide changes
- Admin reindex endpoint — update in-memory index without a redeploy

**Key files:** [`src/lib/intelligence/`](src/lib/intelligence/), [`src/app/api/briefs/`](src/app/api/briefs/), [`src/app/api/intelligence/`](src/app/api/intelligence/)
</details>

<details>
<summary><strong>Investor Tools</strong> — Portfolio & deal flow management</summary>

- Company profile claiming & verification
- Similar-company matching (embedding-based)
- Ecosystem pulse & sector analytics
- Investment thesis presets (filter map by thesis)
- Watchlist with per-company alert conditions
- Brief history & on-demand brief delivery

**Key files:** [`src/lib/investor/`](src/lib/investor/), [`src/components/investor/`](src/components/investor/)
</details>

<details>
<summary><strong>Auth & User Accounts</strong></summary>

- NextAuth v5 with Google OAuth and demo Credentials provider
- Prisma + PostgreSQL for session and preference persistence
- Per-user: watchlist, saved searches, role, digest preferences, notification prefs
- Admin routes protected by `ADMIN_SECRET` header

**Key files:** [`src/auth.ts`](src/auth.ts), [`src/lib/db/`](src/lib/db/), [`prisma/schema.prisma`](prisma/schema.prisma)
</details>

---

## Tech Stack

### Frontend
| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.6 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 + CSS custom properties |
| Animation | Motion 12 (Framer Motion) |
| Maps | Leaflet 1.9.4 + react-leaflet 5 + react-leaflet-cluster |
| UI Primitives | Base UI React 1.4.1 |
| Fonts | Inter (body) + Fraunces (display) via `next/font` |

### Backend & Data
| Layer | Technology |
|---|---|
| Auth | NextAuth v5 (Google OAuth + demo Credentials) |
| Database | PostgreSQL (Neon / Supabase) via Prisma 5 |
| Primary LLM | Anthropic Claude (`claude-sonnet-4-6`) |
| Fast LLM | Groq (`llama-3.3-70b-versatile`) |
| Embeddings | Gemini `text-embedding-004` (3072-dim) |
| Vector Search | In-memory Float32Array cosine similarity |
| SMS | Twilio |
| Email | Gmail OAuth integration |

### Tooling
| Tool | Purpose |
|---|---|
| Playwright | E2E testing |
| ESLint 9 | Linting |
| uv | Python dependency management |
| openpyxl / pandas | Excel/CSV data processing |

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Install & run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The navigator and map work without any environment variables. AI features require API keys (see below).

### Production build

```bash
npm run build
npm run start
```

### Regenerate the company dataset

Re-run any time the source CSV changes:

```bash
npm run data
```

This runs `scripts/generate-companies.mjs` — see [Data Pipeline](#data-pipeline).

### Regenerate resource embeddings (Python)

```bash
uv run scripts/parse_resources.py      # Excel → data/resources.json
uv run scripts/generate_embeddings.py  # resources.json → data/embeddings.json
```

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values you need.

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | For AI agents & intelligence | Claude API key |
| `GEMINI_API_KEY` | For semantic matching | Google Gemini embeddings |
| `LLM_API_KEY` / `GROQ_API_KEY` | For explanations & briefs | Groq API key |
| `LLM_MODEL` | Optional | Override model (default: `llama-3.3-70b-versatile`) |
| `DATABASE_URL` | For auth & persistence | PostgreSQL (Neon / Supabase) |
| `AUTH_SECRET` | For auth | NextAuth signing secret |
| `AUTH_URL` | For auth (prod) | Full URL of the app |
| `GOOGLE_CLIENT_ID` | For Google OAuth | OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | For Google OAuth | OAuth client secret |
| `GOOGLE_REDIRECT_URI` | For Gmail integration | OAuth callback URL |
| `NEXT_PUBLIC_APP_URL` | For absolute links | Public site URL |
| `ADMIN_SECRET` | For `/admin` routes | Header-based admin auth |
| `TWILIO_ACCOUNT_SID` | For SMS delivery | Twilio credentials |
| `TWILIO_AUTH_TOKEN` | For SMS delivery | Twilio credentials |
| `TWILIO_FROM_NUMBER` | For SMS delivery | Sender phone number |
| `EMAIL_SEND_ENABLED` | Optional | Set `true` to enable real email (default: `false`) |
| `GMAIL_SEND_ENABLED` | Optional | Set `true` to enable Gmail delivery (default: `false`) |
| `SMS_SEND_ENABLED` | Optional | Set `true` to enable SMS (default: `false`) |
| `DEMO_AUTH_DISABLED` | Optional | Set `true` to disable the demo login |
| `OPENAI_API_KEY` | Fallback only | OpenAI embeddings (only if no Gemini key) |

> **Zero-env demo:** the landing page, map, and navigator all work without any env vars. API keys unlock AI explanations, agents, and delivery features.

---

## Project Structure

```
Startup-Compass/
├── dataset/                        # Raw source data (do not edit)
│   └── Map Data for Builder Day - Sheet1.csv
├── data/                           # Generated/cached data (git-committed)
│   ├── resources.json              # 211 GOED resources (parsed from Excel)
│   └── embeddings.json             # Pre-computed Gemini embeddings (8.9 MB)
├── scripts/
│   ├── generate-companies.mjs      # CSV → src/data/companies.json
│   ├── parse_resources.py          # Excel → data/resources.json
│   ├── generate_embeddings.py      # Gemini batch embeddings
│   └── data-paths.mjs              # Shared paths for scripts
├── prisma/
│   ├── schema.prisma               # DB schema (User, Session, Watchlist, …)
│   └── migrations/
├── public/
│   ├── hero-utah.png
│   └── utah-map-preview.png
└── src/
    ├── app/
    │   ├── layout.tsx              # Root layout, fonts, SEO metadata
    │   ├── globals.css             # Design tokens + Tailwind v4 @theme
    │   ├── page.tsx                # Landing page
    │   ├── api/                    # 52 API route handlers
    │   │   ├── match/              # Semantic resource matching
    │   │   ├── agents/             # Founder / Investor / Job-hunter agents
    │   │   ├── briefs/             # Brief generation & delivery
    │   │   ├── intelligence/       # Company change detection
    │   │   ├── watchlist/          # Watchlist CRUD & alerts
    │   │   ├── notifications/      # Alert & SMS management
    │   │   ├── integrations/gmail/ # Gmail OAuth flow
    │   │   ├── admin/              # Resource CRUD + reindex
    │   │   ├── settings/           # User preferences
    │   │   ├── user/               # App state
    │   │   ├── digest/             # Digest subscription
    │   │   └── auth/               # NextAuth
    │   └── (pages)/
    │       ├── map/                # /map — interactive startup map
    │       ├── navigator/          # /navigator — quiz entry
    │       ├── results/            # /results — matched resources
    │       ├── agents/             # /agents + sub-routes
    │       ├── dashboard/          # /dashboard
    │       ├── founder-compass/    # /founder-compass
    │       ├── pulse/              # /pulse — weekly digest
    │       ├── watchlist/          # /watchlist
    │       ├── briefs/             # /briefs — brief history
    │       ├── briefs-alerts/      # /briefs-alerts — notification settings
    │       ├── search/             # /search
    │       ├── admin/              # /admin + sub-routes
    │       └── login/              # /login
    ├── components/
    │   ├── map/                    # Leaflet map + filters + panels
    │   ├── investor/               # Watchlist, compare, thesis, pulse
    │   ├── founder/                # Action plan, pathway, outreach
    │   ├── pulse/                  # Weekly digest preview
    │   ├── results/                # Resource fit checker
    │   ├── admin/                  # Resource form
    │   └── (shared)                # Header, Footer, Hero, Nav, …
    ├── lib/
    │   ├── agents/                 # Agent runner, state, LLM interface
    │   ├── intelligence/           # Brief generation, change detection, delivery
    │   ├── investor/               # Similar companies, thesis presets, analytics
    │   ├── founder/                # Action plans, pathways, outreach drafts
    │   ├── recommendation/         # Scoring, intent parsing, resource metadata
    │   ├── pulse/                  # Freshness, weekly digest
    │   ├── db/                     # Prisma helpers (watchlist, state, prefs)
    │   ├── embed.ts                # Pluggable embedding (Gemini / OpenAI)
    │   ├── explain.ts              # Pluggable LLM explanation (Groq / Anthropic)
    │   ├── match.ts                # Core cosine similarity + scoring
    │   ├── map-config.ts           # Sector colors, filter helpers
    │   ├── personas.ts             # Landing page persona content
    │   └── prisma.ts               # Prisma singleton
    ├── hooks/
    │   ├── useUserRole.ts
    │   ├── useInvestorWatchlist.ts
    │   ├── useSavedSearches.ts
    │   ├── useCompanyClaims.ts
    │   ├── useIntentTracking.ts
    │   └── useSelectedCompanyUrlState.ts
    ├── data/
    │   └── companies.json          # Generated Utah company dataset
    └── auth.ts                     # NextAuth configuration
```

---

## Architecture

### Semantic Matching (Navigator)

```
User input (quiz or NL)
        │
        ▼
  Compose profile string
  "I am a Seed-stage founder building FinTech in Salt Lake County…"
        │
        ▼
  Gemini text-embedding-004  ←─ real-time embedding (~200ms)
        │
        ▼
  Cosine similarity against 211 pre-embedded resources  ←─ Float32Array, ~1ms
        │
        ▼
  Hard location filter  (county match OR statewide resource)
        │
        ▼
  Multiplicative boosts  (+10% topic, +10% industry, +10% community)
        │
        ▼
  Top 8 candidates → Groq LLM → personalized explanations (~400ms)
        │
        ▼
  Return top 5–7 results + profile string
```

### Pluggable Provider Design

Both the embedding layer and LLM layer are swappable via env vars — no code changes required:

| Layer | Default | Fallback | Env var |
|---|---|---|---|
| Embeddings | Gemini `text-embedding-004` | OpenAI `text-embedding-3-small` | `GEMINI_API_KEY` / `OPENAI_API_KEY` |
| Explanations | Groq `llama-3.3-70b` | Anthropic Claude | `LLM_API_KEY` / `ANTHROPIC_API_KEY` |

See [`PROVIDER-SWAP.md`](PROVIDER-SWAP.md) for the full swap guide.

### Database Schema (Prisma)

| Model | Purpose |
|---|---|
| `User` | Auth user record |
| `Account` / `Session` | NextAuth OAuth tables |
| `VerificationToken` | Magic-link tokens |
| `UserAppState` | Watchlist, saved searches, role |
| `NotificationPreference` | Email / SMS delivery prefs |
| `WatchlistEntry` | Per-company watchlist with alert conditions |

---

## Data Pipeline

### Company dataset

```
dataset/Map Data for Builder Day - Sheet1.csv
                │
                ▼
        scripts/generate-companies.mjs
        1. Parse CSV (quoted multi-line fields)
        2. Extract city from address
        3. Look up city centroid in ~50-city Utah lat/lng table
        4. Add deterministic jitter (hash of company name)
        5. Normalize stages and sectors
                │
                ▼
        src/data/companies.json  (213+ companies)
```

Run: `npm run data`

> **Why centroid + jitter?** Nominatim geocoding at 1 req/sec would take ~5 minutes for 213 companies. Centroid + jitter is instant and visually equivalent at typical map zoom levels. Swap `generate-companies.mjs` for a Nominatim version with on-disk caching to get street-level precision later.

### Resource embeddings

```
dataset/Resources List - Builder Day.xlsx
                │
                ▼
        scripts/parse_resources.py  →  data/resources.json  (211 resources)
                │
                ▼
        scripts/generate_embeddings.py  →  data/embeddings.json  (8.9 MB, Gemini 3072-dim)
```

The Next.js server loads `embeddings.json` into a module-level `Float32Array` on cold start. To reindex without a redeploy, call `POST /api/admin/reindex` with the `x-admin-secret` header.

---

## AI & Agent System

### Agents

Three conversational agents powered by Anthropic Claude:

- **Founder Advisor** (`/agents/founder-advisor`) — answers founder questions, generates action plans, drafts outreach emails
- **Investor Thesis** (`/agents/investor-thesis`) — analyzes a thesis against the Utah company dataset, scores fit
- **Job Hunter** (`/agents/job-hunter`) — surfaces Utah startup hiring opportunities

Agent infrastructure: [`src/lib/agents/runner.ts`](src/lib/agents/runner.ts), [`src/lib/agents/agentState.ts`](src/lib/agents/agentState.ts)

### Intelligence & Briefs

- **Change detection** (`src/lib/intelligence/changeDetection.ts`) — monitors companies for funding, hiring, and product signals
- **Brief generation** (`src/lib/intelligence/briefService.ts`) — AI-written company summaries (Groq LLM)
- **Delivery** — Gmail OAuth or Twilio SMS (both disabled by default; set `GMAIL_SEND_ENABLED=true` / `SMS_SEND_ENABLED=true`)
- **Cron** — `src/app/api/cron/` for scheduled digest and alert delivery

### Gmail Integration

OAuth 2.0 flow: connect at `/api/integrations/gmail/connect` → callback at `/api/integrations/gmail/callback`. Scopes: send-only.

---

## Design System

The visual identity is intentionally Utah-official.

| Token | Value | Usage |
|---|---|---|
| `--ink` | `#0b1b33` | Primary text, dark surfaces |
| `--surface` | `#fbf7f0` | Page background — warm cream |
| `--accent` | `#b8542a` | Red-rock terracotta (Mighty 5) |
| `--gold` | `#d4af37` | Secondary accent |
| `--utah-red` | `#bf0a30` | Utah flag red |
| `--utah-blue` | `#002868` | Utah flag blue |

Defined as CSS custom properties in [`src/app/globals.css`](src/app/globals.css) and exposed to Tailwind v4 via `@theme inline`.

| Typeface | Role |
|---|---|
| **Fraunces** (variable: opsz, SOFT) | Display headlines |
| **Inter** | Body, UI, captions |

---

## Deployment

The project is plain Next.js — push to GitHub and import into Vercel. No special build config is required.

```bash
# One-time Vercel setup
vercel link
vercel env pull .env.local   # pull env vars from Vercel dashboard
```

Then deploy:

```bash
git push origin main   # Vercel builds automatically
```

Required env vars for a full production deploy: see the [Environment Variables](#environment-variables) table above. At minimum set `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, and `LLM_API_KEY` for AI features, plus `DATABASE_URL` and `AUTH_SECRET` for user accounts.

See [`VERCEL_HANDOFF.md`](VERCEL_HANDOFF.md) for a step-by-step Vercel setup guide.

---

## Additional Documentation

| Document | Contents |
|---|---|
| [`architecture.md`](architecture.md) | Detailed architecture and data model |
| [`DECISIONS.md`](DECISIONS.md) | Locked technical decisions and rationale |
| [`PHASE-GATES.md`](PHASE-GATES.md) | Phase gates and acceptance criteria |
| [`PROVIDER-SWAP.md`](PROVIDER-SWAP.md) | How to swap LLM or embedding providers |
| [`NICE-TO-HAVE.md`](NICE-TO-HAVE.md) | Post-launch feature wishlist |
| [`SystemDesign.md`](SystemDesign.md) | High-level system design |
| [`claude-design.md`](claude-design.md) | Full design system documentation |
| [`VERCEL_HANDOFF.md`](VERCEL_HANDOFF.md) | Vercel deployment notes |
| [`handoff.md`](handoff.md) | Developer handoff notes |

---

## License

Developed for the Utah Governor's Office of Economic Development. Licensing TBD.
