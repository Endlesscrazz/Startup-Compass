---
# Handoff — Startup Compass / Founder's Navigator
Date: 2026-05-08
Session: 1 (complete) + post-session merge

## What was completed
Session 1: scaffold, parse, embed, index, /api/ping — Gate 1 passed.
Post-session: merged founder-navigator/ into repo root (single Next.js app).

## Architecture change: MERGED SINGLE APP
founder-navigator/ has been DELETED. Everything now lives in the repo root.
- Teammates' code: src/app/page.tsx, src/app/map/, src/components/ (landing + map)
- Shreyas's code: src/app/quiz/, src/app/results/, src/app/api/match/, src/lib/index.ts

DO NOT recreate founder-navigator/. The app runs from the repo root.
Run dev server: `npm run dev` from repo root (Startup-Compass/).

## Decisions made
- Embedding: gemini-embedding-001 (3072-dim, NOT 768) — text-embedding-004 was retired
- LLM: Groq llama-3.3-70b-versatile (free tier, ~400ms)
- Single merged Next.js app — no nested apps
- Scoring: cosine × (1 + 0.10×topic + 0.10×industry + 0.10×community) — multiplicative
- "Any" community tag always fires community boost
- Location statewide heuristic: locations.length >= 20
- embeddings.json committed to repo (pre-computed, cold start is instant)
- Providers modular via EMBEDDING_PROVIDER / LLM_PROVIDER env vars

## Completed files
- data/resources.json — 211 resources (213 - 2 deduped)
- data/embeddings.json — 211 × 3072-dim Float32Array vectors
- src/lib/index.ts — module singleton, loads both files at cold start
- src/app/api/ping/route.ts — GET /api/ping → { count: 211, dim: 3072 } ✓
- scripts/parse_resources.py — dataset → resources.json
- scripts/generate_embeddings.py — resources.json → embeddings.json (resumable)

## Gate 1 status
curl localhost:3000/api/ping → {"count":211,"dim":3072} ✓ PASSED

## Pick up here — Session 2
Goal: Build the full /api/match pipeline.
Files to create (all in src/lib/ and src/app/api/match/):
  1. src/lib/counties.ts     — city → county lookup (min 10 cities + "X County" passthrough)
  2. src/lib/profile.ts      — compose profile string from quiz answers (stage-aware template)
  3. src/lib/embed.ts        — call Gemini gemini-embedding-001, return Float32Array
  4. src/lib/match.ts        — cosine sim + location filter + multiplicative boost + top-K
  5. src/lib/explain.ts      — Groq llama-3.3-70b, return JSON array of {id, explanation}
  6. src/app/api/match/route.ts — wire all the above, handle errors gracefully

Gate 2: POST /api/match with Priya profile → returns Salt Lake Angels in top 5, no microloans.

## Must-know constants
- EMBEDDING_DIM = 3072 (gemini-embedding-001) — NOT 768, NOT 1536
- Resource count = 211 — NOT 99, NOT 213
- Statewide heuristic: locations.length >= 20 (95 resources qualify)
- Community tag normalization: quiz "Woman-owned" → data field "Women"
- npm deps in root: @google/genai, groq-sdk (already installed)
- Python deps: google-genai, openpyxl (uv venv at Startup-Compass/.venv)

## Open questions
- iHub is Utah County only — Jordan (SLC) test case won't see it. Raise with GOED organizers.
- Does any teammate have funded OpenAI/Anthropic keys? → 10-min swap if yes (see PROVIDER-SWAP.md)
---
