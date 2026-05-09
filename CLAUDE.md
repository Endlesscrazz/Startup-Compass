# Founder's Navigator — Claude Code Context
# Lives at: ~/Startup-Compass/CLAUDE.md (repo root — merged single app)
# Claude Code reads this automatically when you cd into this directory
# ──────────────────────────────────────────────────────────────────

## WHAT THIS PROJECT IS
A semantic resource matching tool for Utah startup founders. Founders complete
a 30-second intake quiz (4 questions: stage, sector, location, goal) and receive
5–7 ranked Utah state resources with personalized explanations. Built for the
GOED Track 03 bounty at AI Builder Day hackathon (May 8–9, 2026). Part of a
4-person team — Shreyas owns this piece entirely.

This is not a chatbot. This is not a filter UI. It is an embedding-based retrieval
system with hard location eligibility constraints and LLM-generated personalization
on top of ranked results.

## CURRENT STATE
Sessions 1–6 complete. Deployed branch: shreyas/quiz-results-ui.
Built: 211-resource pipeline, /api/match (quiz + NL paths), /navigator (quiz+NL+voice),
/results (cards + share buttons), /api/admin/reindex, /admin UI, atlas theme unified.
Merged with teammate's map/atlas. Next: Vercel deploy + demo prep.

## DEFERRED / NICE-TO-HAVE
See NICE-TO-HAVE.md for full list. Key items:
- Mobile polish (45 min, medium priority)
- Outreach draft email per result (1–2h, high differentiator — needs prompt engineering)
- Marcus/David matching gaps (VBRC, BioUtah industry tags, Wildcat topic fix)
- Real-time LLM streaming (low priority, already < 3s p50)
- Rate limiting on /api/match (post-demo)

## ARCHITECTURE
```
Browser (Next.js — single app at repo root, team shares one codebase)
  └── /quiz (4 steps) → POST /api/match → /results cards
                        POST /api/admin/reindex (protected)

  Team split: teammates own landing page + map (/map). Shreyas owns /quiz, /results, /api/match.

API layer (Next.js API routes)
  /api/match:
    compose profile string → embed (Gemini gemini-embedding-001, 3072-dim) → cosine sim (Float32Array)
    → location filter (hard exclusion) → topic/industry/community boost re-rank
    → LLM explanations (Anthropic) → return top 5–7

In-memory index (module-level singleton)
  resources.json → embeddings.json → IndexEntry[] loaded at cold start

External APIs
  OpenAI text-embedding-3-small (or fastembed — see OPEN-1)
  claude-sonnet-4-6 for explanation generation
```

## LOCKED DECISIONS
- Interface: 4-step quiz → results page. NOT a chatbot, NOT a freeform text input.
- Vector store: in-memory Float32Array. No external vector DB. 99 resources = trivial scale.
- Location filtering: HARD EXCLUSION after semantic ranking — not a soft penalty.
  A resource must list the founder's county (or all 29 counties) to appear in results.
- Results count: 5–7 results. Not 3, not 10.
- LLM role: explanation generation ONLY — runs on top-K after ranking is done.
  LLM does NOT do the matching. Embedding does the matching.
- Admin reindex: POST /api/admin/reindex, protected by ADMIN_SECRET env var.
- Deployment: Vercel. No Docker, no EC2, no containers.
- Data: resources.json (pre-parsed). embeddings.json (pre-computed, committed to repo).
  No live spreadsheet fetching during runtime.

## OPEN ITEMS — RESOLVE THESE BEFORE WRITING ANY CODE
[OPEN-1] Embedding model: OpenAI text-embedding-3-small vs fastembed BAAI/bge-small-en-v1.5
  → Recommendation: which is safer to ship in a hackathon under 18-hour time pressure?
  → Key question: is fastembed install + ONNX runtime reliable in a Vercel serverless env?

[OPEN-2] LLM for explanations: claude-sonnet-4-6 vs gpt-4o-mini
  → Recommendation: which produces better <25-word specific explanations for this use case?
  → Default to claude-sonnet-4-6 unless there's a strong reason not to.

[OPEN-3] Brute-force cosine sim: confirm Float32Array loop over 99 vectors is <1ms.
  → Expected: yes, it is. Just confirm before writing any vector lib dependency.

[OPEN-4] Profile string template — CRITICAL. Stress-test this against all 6 test cases
  before writing the profile.ts implementation:
  Draft template:
  "I am a [stage] founder building a [sector] business in [county], Utah.
   I am looking for [goal].
   [If veteran: I am a veteran entrepreneur.]
   [If women: My business is woman-owned.]
   [If rural: I am based in a rural area.]
   [If student: I am a university student.]"
  Test each of the 6 personas through this template. Do the resulting strings
  produce intuitively correct embeddings? Would "PhD candidate commercializing
  novel technology" land near "EPIC Ventures, University of Utah partner"?

[OPEN-5] City → county lookup table. Build this at the start of implementation.
  Minimum set: Salt Lake City → Salt Lake, Provo → Utah, Ogden → Weber,
  St. George → Washington, Logan → Cache, Moab → Grand, Vernal → Uintah,
  Price → Carbon, Cedar City → Iron, Heber City → Wasatch.
  Handle "Salt Lake County", "Weber County" typed directly (strip " County").

[OPEN-6] Admin auth: env var header check is sufficient for hackathon.
  Implementation: if (req.headers.authorization !== process.env.ADMIN_SECRET) return 401
  Do NOT build a login UI — waste of time. Include the secret in the team's shared doc.

[OPEN-7] Cold start strategy: commit embeddings.json to the repo.
  This means: run the embedding script locally, generate embeddings.json,
  commit it, and the Vercel deployment has vectors ready at startup with zero
  API call needed. If resources.json changes, re-run locally and recommit.
  The /api/admin/reindex endpoint is for runtime updates AFTER initial deployment.

## THE 6 TEST CASES — VALIDATE EVERY CHANGE AGAINST THESE
These are the live judging rubric. If any of these fail, the demo fails.

Jordan (20, SLC, idea stage) → should see: Get Started grant, Lassonde, iHub
  MUST NOT see: VC firms, revolving loan funds
Maria (38, Washington County, rural, woman, agriculture, scaling) →
  should see: Utah's Own, UDAF, Iron/Washington county resources
  MUST NOT see: SLC coworking spaces, tech-only VCs
Marcus (34, Weber County, veteran, manufacturing, early) →
  should see: Veteran registry, Utah MEP, iMpact Utah, Weber County resources
  MUST NOT see: SaaS-focused VCs, student resources
Priya (31, SLC, SaaS, paying customers, raising round) →
  should see: Salt Lake Angels, Park City Angels, Peterson Ventures, Pelion
  MUST NOT see: microloans, Job Corps, apprenticeship programs
David (45, Utah County, medical device, 12 employees, FDA cleared, international) →
  should see: WTC Utah, BioUtah, BIOHive, international trade resources
  MUST NOT see: pre-revenue resources, student grants
Dr. Amir (29, SLC, PhD, novel tech, commercializing, never started a business) →
  should see: EPIC Ventures (U of U partner), Lassonde, Silicon Slopes
  MUST NOT see: manufacturing resources, late-stage revolving loan funds

## PROJECT-SPECIFIC RULES
- NEVER call the embedding API during the main request path for resources.
  Embeddings are pre-computed. Only the founder profile is embedded at request time.
- NEVER add a database. Everything lives in memory and flat JSON files.
- NEVER stream the LLM response. Wait for the full JSON array of explanations before
  returning to the client. Partial streaming with a JSON parse is a time sink.
- ALL location filtering must happen server-side. Never trust client-sent county
  names without normalizing them server-side first.
- The LLM explanation prompt must return JSON only — no preamble, no markdown.
  System prompt must explicitly say "Return a JSON array only. No other text."
- Keep the quiz to exactly 4 steps. Do not add a 5th step. Time is limited.
- Error handling for API failures: if OpenAI embed call fails → return 503 with
  message "Matching service temporarily unavailable". Do not show a blank results page.
- If LLM explanation call fails → return results with generic explanations
  (just the resource description, truncated to 25 words). Do not block on this.
- Never Access or edit .env.local file, unless i say so

## RESUME / INTERVIEW CONTEXT
Core engineering problem: semantic retrieval with hard location constraints
Portfolio gap filled: first retrieval system with civic/government use case
Metrics to fill in: response p50 (target <3s), test case pass rate (target 6/6)
What I'd do differently: TBD — fill in after completion

## DECISIONS LOG
See DECISIONS.md in this directory.
Claude Code maintains this file — do not edit manually.
