# Founder's Navigator — Architecture
# Generated: 2026-05-08 by Side Projects Agent
# → Claude Code CLI reviews and may suggest modifications before building
# ─────────────────────────────────────────────────────────────────────

## COMPONENT DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────┐
│  BROWSER                                                            │
│                                                                     │
│  /navigator                             /results        /admin      │
│  ┌─────────────────────────────┐       ┌──────────┐   ┌─────────┐  │
│  │  [Quiz tab]  [Describe tab] │──────▶│ Results  │   │  Admin  │  │
│  │  4-step quiz │ textarea     │  API  │ (5–7     │   │ reindex │  │
│  │              │ + mic button │       │  cards)  │   │         │  │
│  └─────────────────────────────┘       └──────────┘   └─────────┘  │
│    Path A: {stage,sector,city,goal}  Path B: {description,city}    │
│         │                      │                      │            │
└─────────┼──────────────────────┼──────────────────────┼────────────┘
          │ POST /api/match       │                      │ POST /api/admin/reindex
          ▼                      │                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│  NEXT.JS API ROUTES (server-side)                                   │
│                                                                     │
│  /api/match                    /api/admin/reindex                   │
│  ┌──────────────────────┐      ┌──────────────────────┐            │
│  │ 1. Receive answers   │      │ 1. Verify secret     │            │
│  │ 2. Compose profile   │      │ 2. Re-run embed      │            │
│  │    string            │      │    pipeline          │            │
│  │ 3. Embed profile     │      │ 3. Reload in-memory  │            │
│  │ 4. Cosine sim        │      │    index             │            │
│  │ 5. Location filter   │      └──────────────────────┘            │
│  │ 6. Topic boost       │                                           │
│  │ 7. LLM explanations  │                                           │
│  │ 8. Return top 5–7    │                                           │
│  └──────────────────────┘                                           │
│             │                       │                               │
│             ▼                       ▼                               │
│  ┌─────────────────────┐   ┌──────────────────────┐                │
│  │  In-Memory Index    │   │  resources.json       │                │
│  │  (module-level      │   │  (99 resources,       │                │
│  │   Float32Array[])   │   │   parsed from sheet)  │                │
│  └─────────────────────┘   └──────────────────────┘                │
└────────────────────┬────────────────────────────────────────────────┘
                     │ API calls
          ┌──────────┴──────────┐
          ▼                     ▼
  ┌───────────────┐    ┌─────────────────┐
  │ OpenAI        │    │ Anthropic        │
  │ Embeddings    │    │ claude-sonnet-4-6│
  │ (profile →    │    │ (generate 1-line │
  │  vector)      │    │  explanations)   │
  └───────────────┘    └─────────────────┘
```

## TECH STACK

| Component | Technology | Why chosen | Shreyas's depth |
|-----------|-----------|------------|-----------------|
| Framework | Next.js 14 (App Router) | Full-stack in one repo, Vercel deploy is one command, API routes co-located with UI | MEDIUM |
| Styling | Tailwind CSS + shadcn/ui | shadcn gives production-quality components at copy-paste speed — Design is 25% of judging | MEDIUM |
| Embedding API | **Gemini gemini-embedding-001** (3072-dim, free) | text-embedding-004 retired; abstracted in lib/embed.ts — swap to OpenAI in 10 min, see PROVIDER-SWAP.md | HIGH — owns this logic |
| Vector math | Plain Float32Array + cosine sim | 211 resources × 3072-dim, brute-force loop is ~1ms — zero dependency needed | HIGH — owns this logic |
| LLM explanations | **Groq llama-3.3-70b** (free) | Fastest 70B inference available (~400ms); abstracted in lib/explain.ts — swap to Anthropic/OpenAI, see PROVIDER-SWAP.md | HIGH — owns this logic |
| In-memory store | Module-level array, loaded at cold start | No DB needed at this scale, instant query time | HIGH |
| Data source | resources.json (pre-parsed from spreadsheet) | 213 GOED resources, pipe-delimited → JSON transform done once | HIGH |
| Deployment | Vercel | Zero-config Next.js deploy, env vars via dashboard, URL ready in 5 min | MEDIUM |
| Admin reindex | Next.js API route + ADMIN_SECRET header | Non-technical content updates without redeployment | HIGH |

### Provider Modularity

Both `lib/embed.ts` and `lib/explain.ts` expose stable interfaces.
The provider (Gemini/OpenAI/Cohere for embed; Groq/Anthropic/OpenAI for LLM)
is selected by environment variable and is a one-file change.

```
EMBEDDING_PROVIDER=gemini   # or: openai, cohere
LLM_PROVIDER=groq           # or: anthropic, openai
```

Full swap instructions: see **PROVIDER-SWAP.md** in project root.

⚠️  If you swap embedding providers you MUST regenerate data/embeddings.json —
    resource vectors and profile vectors must use the same model and dimension.
    LLM provider swaps are independent and require no re-embedding.

## THE KEY ARCHITECTURAL DECISION

**Decision:** Profile-string embedding over structured query construction

**What this means in practice:**
Instead of building a structured query object (`{stage: "pre-revenue", sector: "SaaS",
county: "Salt Lake", goal: "funding"}`) and writing rules to match it against resource
metadata, we compose a natural language string:

  *"I am a pre-revenue SaaS founder in Salt Lake County, Utah. I am looking for
   funding and early-stage mentorship to launch my business."*

Then we embed that string and run cosine similarity against pre-embedded resource
descriptions.

**Alternatives considered:**
- **Structured metadata filtering only:** rejected — requires founders to know the
  right vocabulary, misses semantic connections (e.g. "commercializing PhD research"
  → "EPIC Ventures at University of Utah"). Fast and deterministic, but wrong for
  the use case.
- **Full conversational chatbot (LLM-only):** rejected — slow to demo, hard to
  evaluate against 6 test cases, inconsistent results, hallucination risk on
  resource details. Impressive in a demo, unreliable in a live judge walkthrough.
- **Hybrid keyword + BM25 ranking:** rejected — adds complexity without the key
  benefit. The semantic match IS the differentiator.

**Trade-off accepted:** Embedding quality depends on how well the profile string
captures the founder's intent. A poorly composed template will produce mediocre
results even with a good embedding model. The profile string template is therefore
a critical design decision — it needs to be stress-tested against all 6 test cases
before the implementation is considered correct. See [OPEN-4].

**Why it's right at this scale:** 213 resources × 768-dim vectors = trivial memory
footprint (~660KB). Brute-force cosine similarity takes ~0.3ms. The only latency
is the two API calls (embed + LLM). Both are parallelizable in principle but
run sequentially in the MVP (embed first, then LLM on top-8 results only).

**How to explain in an interview:**
"The core insight is that 'pre-revenue SaaS founder looking for funding' and
'EPIC Ventures partnered with University of Utah to support early-stage technology
companies' have zero keyword overlap but are semantically adjacent in embedding
space. A filter UI can't bridge that gap — it requires the founder to already know
the right vocabulary. Profile-string embedding means the system meets the founder
where they are and does the vocabulary translation for them. The trade-off is that
the template matters a lot — we spent real time tuning the profile string to make
sure the embedding captures the signal that matters, and we validated against 6
specific test cases before shipping."

## DATA MODEL

### resources.json (source of truth, checked into repo)
```typescript
interface Resource {
  id: number                  // from spreadsheet (e.g. 2543)
  title: string               // resource name
  description: string         // full description text
  communities: string[]       // ["Rural", "Women", "Veteran", "Student", ...]
  industries: string[]        // ["Software and Information Technology", ...]
  locations: string[]         // Utah county names ["Salt Lake", "Weber", ...]
  topics: string[]            // ["Funding", "Start a Business", "Late Stage Growth", ...]
  link: string                // external URL
  email: string               // contact email (may be empty)
}
```

### In-memory index (module-level, loaded at server cold start)
```typescript
export const EMBEDDING_DIM = 3072  // gemini-embedding-001 (text-embedding-004 retired). Change to 1536 for OpenAI.

interface IndexEntry {
  resource: Resource
  vector: Float32Array        // EMBEDDING_DIM-dim vector of composed resource string
}

// module-level singleton — survives across requests in one server process
let resourceIndex: IndexEntry[] = []
let indexReady = false
```

### API request/response
```typescript
// POST /api/match
interface MatchRequest {
  stage: 'idea' | 'building' | 'revenue' | 'growth'
  sector: string              // from a fixed list — maps to industries[] field
  city: string                // raw user input — normalised server-side via counties.ts
  county: string              // resolved Utah county name
  goal: string                // from a fixed list
  community?: string[]        // ["Veteran", "Women", "Rural", "Student"] — optional
                              // NOTE: data uses "Women" not "Woman-owned" — mapped server-side
}

interface MatchResponse {
  results: MatchResult[]
  profileString: string       // debug + "How it works" panel on results page
}

interface MatchResult {
  resource: Resource
  score: number               // final_score after boost (not raw cosine sim)
  explanation: string         // LLM-generated 1-sentence personalization
  categoryBadge: string       // "Funding" | "Community" | "Workspace" | "Growth" | "Events"
}
```

## API / INTERFACE DESIGN

### Intake quiz (4 steps, client-side state, no API call until step 4 submit)

Step 1 — Stage:
  Options: "Just an idea" / "Building, no revenue yet" /
           "Paying customers, growing" / "Established business"
  Maps to: idea / building / revenue / growth

Step 2 — Sector:
  Options: "Tech / SaaS" / "Life Sciences" / "Manufacturing" /
           "Agriculture" / "Aerospace & Defense" / "Retail / CPG" / "Other"
  Maps to: Software and Information Technology / Life Sciences and Healthcare /
           Manufacturing / Agriculture / Aerospace and Defense / Consumer Packaged Goods / Other

Step 3 — Location (typed input with suggestions, not a full dropdown):
  Input: city name or county name
  Normalised server-side via lib/counties.ts city→county lookup
  Fallback: if not matched, show county picker dropdown

Step 4 — Goal + Community tags:
  Primary goal (single select): "Finding funding" / "Finding mentorship & community" /
    "Finding workspace" / "Growing or scaling" / "Going international"
  Community tags (multi-select, optional): "Veteran-owned" / "Woman-owned" /
    "Rural business" / "University student"
  Maps to: goal string + communities[] array
  UI label → API value: "Woman-owned" → "Women" (matches data field)

### POST /api/match — two input paths, same pipeline from step 3 onward

```
PATH A — Quiz (structured inputs):
  Body: { stage, sector, city, goal, community? }
  1. Validate required fields, return 400 if missing
  2. Normalise community tags: "Woman-owned" → "Women" etc.
  3. resolveCounty(city) → county  (return 422 if unresolved)
  4. composeProfileString({stage,sector,city,county,goal,community}) → profileString
  5. → [shared pipeline]
  6. rankResources with FULL boost (topic + industry + community)

PATH B — Natural language (free text):
  Body: { description, city }
  1. sanitizeDescription(description) → strip HTML, cap 500 chars  [DECISION-18]
  2. resolveCounty(city) → county  (return 422 if unresolved)
  3. description used directly as profileString  [DECISION-17]
  4. → [shared pipeline]
  5. rankResources with NO boost — pure cosine similarity
     (stage/sector/goal not known, boost would be noise)

SHARED PIPELINE (both paths from here):
  → embedText(profileString) → profileVector (3072-dim Float32Array via Gemini)
     On failure → 503 "Matching service temporarily unavailable"
  → For each entry in resourceIndex:
      a. isEligible: locations.includes("Utah") OR
                     locations.length >= STATEWIDE_MIN_LOCATIONS(20) OR
                     locations.includes(county)   [DECISION-16]
      b. sim = cosineSim(profileVector, entry.embedding)
      c. boost = boostMultiplier(entry, goal, sector, community)  [PATH A only]
      d. score = sim * boost
  → Sort descending, take top 8
  → generateExplanations(profileString, top8):
      System prompt: untrusted-input notice + JSON-only instruction  [DECISION-18]
      User prompt:   <founder_profile>…</founder_profile> + resources JSON
      On failure → fallback to first 25 words of description
  → Return { results: top8WithExplanations, profileString, county }
```

### POST /api/admin/reindex
```
1. Check Authorization header === process.env.ADMIN_SECRET → 401 if not
2. Read resources.json from disk
3. For each resource, compose embedding string:
   "[title]. [description]. Industries: [industries]. Topics: [topics]. Communities: [communities]."
4. Embed in batches of 20 with 700ms delay between batches (Gemini rate limit)
   — swap to batch size 100 + no delay if using OpenAI
5. Rebuild resourceIndex in memory
6. Optionally write new embeddings.json to disk (for persistence across restarts)
7. Return {reindexed: N, durationMs: X}
```

## DEPLOYMENT

- Platform: Vercel (free tier is sufficient)
- Build command: `next build`
- Environment variables (default / free tier):
  - `GEMINI_API_KEY`        — for embedding (gemini-embedding-001, 3072-dim)
  - `GROQ_API_KEY`          — for explanation generation (llama-3.3-70b)
  - `EMBEDDING_PROVIDER`    — "gemini" | "openai" | "cohere" (default: gemini)
  - `LLM_PROVIDER`          — "groq" | "anthropic" | "openai" (default: groq)
  - `ADMIN_SECRET`          — protects /api/admin/reindex
  See PROVIDER-SWAP.md for paid provider swap instructions.
- Cold start: embeddings.json pre-committed to repo → index loads in <100ms,
  zero API calls needed. /api/admin/reindex handles runtime resource updates.

## FILE STRUCTURE
```
Startup-Compass/  ← repo root, single Next.js app (merged)
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Team landing page (teammates own)
│   │   ├── map/                        # Team map page (teammates own)
│   │   ├── navigator/
│   │   │   ├── page.tsx                # Shell — Header + QuizClient ✓ DONE
│   │   │   ├── QuizClient.tsx          # 4-step quiz UI ✓ DONE
│   │   │   └── NLClient.tsx            # NL textarea + voice button  ← Session 4
│   │   ├── results/
│   │   │   ├── page.tsx                # Shell ✓ DONE
│   │   │   └── ResultsClient.tsx       # sessionStorage → /api/match → cards ✓ DONE
│   │   └── api/
│   │       ├── ping/route.ts           # GET /api/ping ✓ DONE
│   │       ├── match/route.ts          # POST /api/match — Path A + B  ← Session 4
│   │       └── admin/reindex/route.ts  # ← Session 6
│   ├── lib/
│   │   ├── index.ts                    # In-memory index singleton ✓ DONE
│   │   ├── embed.ts                    # Gemini gemini-embedding-001 ✓ DONE
│   │   ├── match.ts                    # Cosine sim + filter + boost ✓ DONE
│   │   ├── explain.ts                  # Groq explanations + injection defence ✓ DONE
│   │   ├── profile.ts                  # Quiz profile string composer ✓ DONE
│   │   ├── counties.ts                 # City → county lookup ✓ DONE
│   │   └── sanitize.ts                 # NL input sanitization ✓ DONE
│   └── components/
│       ├── ui/button.tsx               # base-ui button ✓
│       ├── Header.tsx                  # Team header ✓
│       ├── Footer.tsx                  # Team footer ✓
│       ├── ResultCard.tsx              # Result card ✓ DONE
│       └── CategoryBadge.tsx           # Topic/community badge ✓ DONE
├── data/
│   ├── resources.json                  # 211 resources ✓ DONE
│   └── embeddings.json                 # 211 × 3072-dim ✓ DONE
└── scripts/
    ├── parse_resources.py              # ✓ DONE
    ├── generate_embeddings.py          # ✓ DONE
    ├── personas.json                   # 6 custom edge-case personas (stress test)
    ├── personas_eval.py                # LLM-as-Judge eval harness  ← Session 5
    └── generate-companies.mjs         # Team script (do not modify)
```

## WHAT CLAUDE CODE SHOULD REVIEW
1. Resolve [OPEN-1]: embedding model — OpenAI vs fastembed for hackathon
2. Resolve [OPEN-2]: LLM — claude-sonnet-4-6 vs gpt-4o-mini
3. Resolve [OPEN-3]: confirm Float32Array brute-force is fast enough (it is)
4. Resolve [OPEN-4]: stress-test profile string template against all 6 test cases
   BEFORE writing any implementation code
5. Resolve [OPEN-5]: build city → county lookup table for top ~20 Utah cities
6. Resolve [OPEN-6]: admin auth — env var header vs passphrase UI
7. Resolve [OPEN-7]: embeddings.json committed to repo vs auto-reindex on cold start
8. Stress-test the location filter logic: "statewide" resources list all 29 counties —
   verify this is actually true in the data, or write a heuristic to detect it
9. Validate the LLM explanation prompt produces <25-word, specific, non-generic output
   before wiring it to the full pipeline
