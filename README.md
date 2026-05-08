# Startup Compass

The official front door to Utah's startup ecosystem.

A two-product platform built for the Utah Governor's Office of Economic Development:

1. **The Founder's Navigator** &mdash; a personalized guide that surfaces the right state programs, capital sources, and mentorship for any founder, in under two minutes.
2. **The Utah Startup Map** &mdash; an interactive, self-service directory of every company being built in Utah, designed for founders and investors alike.

This repository currently contains:

- The **landing page** at `/` &mdash; the public entry point with a persona switcher
- The **Utah Startup Map** at `/map` &mdash; a Leaflet + OpenStreetMap interactive map of every Utah company in the dataset
- The **Founder's Navigator** (`/navigator`) is the next product page to build

## Stack

- [Next.js 16](https://nextjs.org) (App Router)
- TypeScript
- [Tailwind CSS v4](https://tailwindcss.com)
- [Motion](https://motion.dev) (Framer Motion) for hero entrance + persona-switch animations
- [Leaflet](https://leafletjs.com) + [react-leaflet](https://react-leaflet.js.org) for the OSM map
- [Inter](https://rsms.me/inter/) (body) + [Fraunces](https://fonts.google.com/specimen/Fraunces) (display) via `next/font`

## Design system

The visual identity is intentionally Utah-official:

| Token              | Value     | Usage                                  |
| ------------------ | --------- | -------------------------------------- |
| `--ink`            | `#0b1b33` | Primary text, dark surfaces, brand     |
| `--surface`        | `#fbf7f0` | Page background &mdash; warm cream     |
| `--accent`         | `#b8542a` | Red-rock terracotta (Mighty 5 inspired) |
| Display typeface   | Fraunces  | Headlines (variable: opsz, SOFT)       |
| Body typeface      | Inter     | Body, UI, captions                     |

All tokens are defined as CSS custom properties in `src/app/globals.css` and exposed to Tailwind v4 via `@theme inline`.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production build

```bash
npm run build
npm run start
```

## Map data pipeline

Raw inputs live in **`dataset/`** (see `src/lib/dataset.ts` for path names).

- **Map companies:** `dataset/Map Data for Builder Day  - Sheet1.csv`
- **Resources (Navigator):** `dataset/Resources List - Builder Day.xlsx`

The map CSV is converted to `src/data/companies.json` by a one-shot Node script (`scripts/generate-companies.mjs`, paths in `scripts/data-paths.mjs`) that:

1. Parses the CSV (quoted multi-line fields and all)
2. Extracts the city from each address
3. Looks up the city's centroid in a curated Utah lat/lng table (~50 cities covered)
4. Adds deterministic jitter (hash of company name) so multiple companies in the same city don't stack on a single pixel
5. Normalizes stages (Pre-Seed, Seed, Series A, etc.) and sectors (B2B Software, FinTech, Bio/Medical Tech, etc.)

Re-run any time the CSV changes:

```bash
npm run data
```

### Why centroid + jitter (not real geocoding)?

For the hackathon demo, real per-address geocoding via Nominatim takes ~5 minutes (rate-limited at 1 req/sec). Centroid + jitter is instant and visually equivalent at the zoom levels judges care about. To upgrade to street-precise pins later, swap `scripts/generate-companies.mjs` for a Nominatim-based version with on-disk caching.

## Deploying to Vercel

The project is plain Next.js with no special config &mdash; push to GitHub and import into Vercel. No environment variables are required for the landing page.

## Project structure

```
dataset/
  Map Data for Builder Day  - Sheet1.csv   # raw — Utah Startup Map
  Resources List - Builder Day.xlsx        # raw — Founder's Navigator
scripts/
  data-paths.mjs          # shared paths for build scripts
  generate-companies.mjs  # CSV → JSON pipeline
src/
  app/
    layout.tsx            # Root layout, fonts, SEO metadata
    page.tsx              # Landing page (Hero + ProductShowcase)
    globals.css           # Design tokens + Tailwind v4 theme
    icon.svg              # Favicon (compass mark)
    map/
      page.tsx            # /map (server entry)
      MapPageClient.tsx   # Filter state + dynamic import of the map
  components/
    Header.tsx
    Hero.tsx              # Persona switcher + animated content
    PersonaSwitcher.tsx
    ProductShowcase.tsx
    Footer.tsx
    CompassMark.tsx
    StartupMap.tsx        # Leaflet/OSM map (client only)
    MapFilters.tsx        # Sector/stage/employees/search sidebar
    startup-map.css       # Brand-matched Leaflet overrides
  data/
    companies.json        # Generated dataset (do not edit by hand)
  lib/
    dataset.ts            # Repo-relative paths for raw + generated data
    map-config.ts         # Sector colors, filter helpers
    personas.ts           # Hero persona content
```

## License

This project is being developed for the Utah Governor's Office of Economic Development. Licensing TBD.
