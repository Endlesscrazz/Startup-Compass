#!/usr/bin/env node
/**
 * Build-time data pipeline.
 *
 * Reads: dataset/Map Data for Builder Day  - Sheet1.csv
 * Writes: src/data/companies.json
 *
 * Paths: scripts/data-paths.mjs (and human-readable names in src/lib/dataset.ts)
 *
 * Re-run with: `npm run data`
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import {
  GENERATED_COMPANIES_JSON,
  MAP_COMPANIES_CSV,
} from "./data-paths.mjs";

const CSV_PATH = MAP_COMPANIES_CSV;
const OUT_PATH = GENERATED_COMPANIES_JSON;

// ---------------------------------------------------------------------------
// Utah city centroids (lat, lng).
// These are official-ish geographic centers for each city.
// Coverage targets every city present in the hackathon dataset.
// ---------------------------------------------------------------------------
const CITY_CENTROIDS = {
  "salt lake city": [40.7608, -111.891],
  "lehi": [40.3916, -111.8508],
  "provo": [40.2338, -111.6585],
  "orem": [40.2969, -111.6946],
  "park city": [40.6461, -111.498],
  "ogden": [41.223, -111.9738],
  "west valley city": [40.6916, -112.0011],
  "west valley": [40.6916, -112.0011],
  "sandy": [40.5649, -111.8389],
  "south jordan": [40.5621, -111.9297],
  "draper": [40.5247, -111.8638],
  "heber city": [40.5071, -111.4133],
  "heber": [40.5071, -111.4133],
  "kaysville": [41.0353, -111.9388],
  "layton": [41.0602, -111.9711],
  "bountiful": [40.8894, -111.8808],
  "holladay": [40.6677, -111.8244],
  "lindon": [40.3411, -111.7208],
  "american fork": [40.3768, -111.7957],
  "pleasant grove": [40.3641, -111.7385],
  "logan": [41.737, -111.8338],
  "st. george": [37.0965, -113.5684],
  "st george": [37.0965, -113.5684],
  "saint george": [37.0965, -113.5684],
  "cedar city": [37.6775, -113.0619],
  "murray": [40.6669, -111.888],
  "cottonwood heights": [40.6197, -111.81],
  "eagle mountain": [40.3144, -112.0066],
  "midvale": [40.6111, -111.8755],
  "riverton": [40.5219, -111.9391],
  "herriman": [40.5141, -112.033],
  "spanish fork": [40.115, -111.6549],
  "vineyard": [40.3066, -111.7546],
  "saratoga springs": [40.3499, -111.9046],
  "tooele": [40.5308, -112.2982],
  "centerville": [40.9183, -111.8722],
  "farmington": [40.9805, -111.8872],
  "north salt lake": [40.8488, -111.9072],
  "millcreek": [40.6869, -111.8755],
  "taylorsville": [40.6677, -111.9388],
  "west jordan": [40.6097, -111.9391],
  "syracuse": [41.0891, -112.0627],
  "clearfield": [41.1108, -112.0252],
  "roy": [41.1616, -112.0263],
  "north logan": [41.7691, -111.8043],
  "smithfield": [41.838, -111.8327],
  "richfield": [38.7716, -112.0838],
  "moab": [38.5733, -109.5498],
  "vernal": [40.4555, -109.5287],
  "price": [39.5994, -110.8107],
};

// Default fallback: Salt Lake City — the dataset's plurality
const DEFAULT_CENTROID = CITY_CENTROIDS["salt lake city"];

// ---------------------------------------------------------------------------
// CSV parser — handles RFC 4180 quoted fields with embedded commas + newlines.
// ---------------------------------------------------------------------------
function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 2;
        } else {
          inQuotes = false;
          i += 1;
        }
      } else {
        cell += ch;
        i += 1;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i += 1;
      } else if (ch === ",") {
        row.push(cell);
        cell = "";
        i += 1;
      } else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && text[i + 1] === "\n") i += 1;
        row.push(cell);
        cell = "";
        rows.push(row);
        row = [];
        i += 1;
      } else {
        cell += ch;
        i += 1;
      }
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function clean(value) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function slugify(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Extracts the most likely Utah city from a free-form address.
 * The CSV addresses are formatted ad-hoc, so we try several patterns.
 */
function extractCity(address) {
  if (!address) return null;
  const a = address.replace(/\s+/g, " ").trim();
  // First, try `, City, UT[ ZIP]` pattern (most common)
  const m1 = a.match(/,\s*([A-Za-z][A-Za-z .'-]+?)\s*,\s*UT(AH)?\b/i);
  if (m1) return m1[1].toLowerCase().trim();
  // Try ` City Utah ZIP` with no commas (rare ad-hoc format)
  const m2 = a.match(/\b([A-Za-z][A-Za-z .'-]+?)\s+UT(AH)?\s+\d{5}/i);
  if (m2) return m2[1].toLowerCase().trim();
  // Try ` City, UT` at end without comma before
  const m3 = a.match(/([A-Za-z][A-Za-z .'-]+?),?\s+UT(AH)?$/i);
  if (m3) return m3[1].toLowerCase().trim();
  return null;
}

/** Deterministic jitter from a string — gives reproducible spread. */
function jitter(seed) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // Two pseudo-random values from the same hash, range [-1, 1)
  const a = ((h & 0xffff) / 0xffff) * 2 - 1;
  const b = (((h >>> 16) & 0xffff) / 0xffff) * 2 - 1;
  return [a, b];
}

const LAT_JITTER = 0.012; // ~1.3km
const LNG_JITTER = 0.015; // ~1.3km at Utah latitude

function normalizeStage(stage) {
  const s = (stage || "").toLowerCase().trim().replace(/\s+/g, " ");
  if (!s) return "Unknown";
  if (s.includes("pre-seed") || s.includes("preseed")) return "Pre-Seed";
  if (s.includes("seed")) return "Seed";
  if (s.includes("series a")) return "Series A";
  if (s.includes("series b")) return "Series B";
  if (s.includes("series c")) return "Series C";
  if (s.includes("bootstrap")) return "Bootstrapped";
  if (s.includes("growth")) return "Growth";
  return stage.trim();
}

function normalizeSector(sector) {
  const s = (sector || "").trim();
  if (!s) return "Other";
  // Tidy whitespace + casing on a few known noisy values
  const lower = s.toLowerCase();
  if (lower.includes("b2b")) return "B2B Software";
  if (lower.includes("bio") || lower.includes("medical")) return "Bio/Medical Tech";
  if (lower.includes("fintech")) return "FinTech";
  if (lower.includes("security")) return "Security";
  if (lower.includes("energy")) return "Energy";
  if (lower.includes("consumer")) return "Consumer";
  if (lower.includes("aero") || lower.includes("defense")) return "Aerospace & Defense";
  if (lower.includes("ai") && lower.length < 12) return "AI";
  return s;
}

function normalizeEmployees(value) {
  const v = (value || "").trim();
  if (!v) return "Unknown";
  return v;
}

function normalizeWebsite(url) {
  const u = (url || "").trim();
  if (!u) return null;
  if (/^https?:\/\//i.test(u)) return u;
  return `https://${u.replace(/^\/+/, "")}`;
}

function normalizeLinkedIn(url) {
  const u = (url || "").trim();
  if (!u) return null;
  if (/^https?:\/\//i.test(u)) return u;
  return `https://${u.replace(/^\/+/, "")}`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main() {
  if (!existsSync(CSV_PATH)) {
    console.error(
      `Missing map companies CSV:\n  ${CSV_PATH}\n` +
        "Place the hackathon export under dataset/ (see src/lib/dataset.ts — rawDataset.mapCompaniesCsv).",
    );
    process.exit(1);
  }

  const csv = readFileSync(CSV_PATH, "utf8");
  const rows = parseCSV(csv);
  const [header, ...body] = rows;

  // Map header indexes — be tolerant of small naming variations
  const idx = {};
  header.forEach((h, i) => {
    const key = h.toLowerCase().trim();
    if (key.includes("startup name")) idx.name = i;
    else if (key.includes("full address")) idx.address = i;
    else if (key.startsWith("description")) idx.description = i;
    else if (key === "website") idx.website = i;
    else if (key === "stage") idx.stage = i;
    else if (key.includes("employees")) idx.employees = i;
    else if (key === "section") idx.sector = i;
    else if (key.includes("linkedin")) idx.linkedin = i;
    else if (key === "display type") idx.displayType = i;
  });

  const seenIds = new Set();
  const companies = [];
  let unmatched = 0;

  for (const r of body) {
    if (!r || r.length === 0) continue;
    const name = clean(r[idx.name]);
    if (!name) continue;

    const address = clean(r[idx.address]);
    const description = clean(r[idx.description]);
    const website = normalizeWebsite(r[idx.website]);
    const linkedin = normalizeLinkedIn(r[idx.linkedin]);
    const stage = normalizeStage(r[idx.stage]);
    const employees = normalizeEmployees(r[idx.employees]);
    const sector = normalizeSector(r[idx.sector]);

    const cityKey = extractCity(address);
    let centroid = null;
    let cityLabel = null;
    if (cityKey && CITY_CENTROIDS[cityKey]) {
      centroid = CITY_CENTROIDS[cityKey];
      cityLabel = cityKey
        .split(/\s+/)
        .map((w) => w[0].toUpperCase() + w.slice(1))
        .join(" ");
    } else {
      centroid = DEFAULT_CENTROID;
      cityLabel = cityKey
        ? cityKey
            .split(/\s+/)
            .map((w) => w[0].toUpperCase() + w.slice(1))
            .join(" ")
        : "Salt Lake City";
      unmatched += 1;
    }

    const [jx, jy] = jitter(name + "::" + (address || ""));
    const lat = centroid[0] + jx * LAT_JITTER;
    const lng = centroid[1] + jy * LNG_JITTER;

    let id = slugify(name);
    if (!id) id = `company-${companies.length}`;
    while (seenIds.has(id)) id = `${id}-x`;
    seenIds.add(id);

    companies.push({
      id,
      name,
      address: address || null,
      city: cityLabel,
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
      description: description || null,
      website,
      linkedin,
      stage,
      employees,
      sector,
    });
  }

  // Stable sort for deterministic output
  companies.sort((a, b) => a.name.localeCompare(b.name));

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(companies, null, 2) + "\n", "utf8");

  // Summary
  const sectors = new Map();
  const stages = new Map();
  const cities = new Map();
  for (const c of companies) {
    sectors.set(c.sector, (sectors.get(c.sector) || 0) + 1);
    stages.set(c.stage, (stages.get(c.stage) || 0) + 1);
    cities.set(c.city, (cities.get(c.city) || 0) + 1);
  }

  console.log(`Wrote ${companies.length} companies → ${OUT_PATH}`);
  console.log(`  ${unmatched} fell back to default city centroid`);
  console.log(
    `  Sectors: ${[...sectors.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${k} (${v})`)
      .join(", ")}`,
  );
  console.log(
    `  Stages: ${[...stages.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${k} (${v})`)
      .join(", ")}`,
  );
  console.log(
    `  Top cities: ${[...cities.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([k, v]) => `${k} (${v})`)
      .join(", ")}`,
  );
}

main();
