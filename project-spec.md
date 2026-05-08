# Founder's Navigator — Project Spec
# Generated: 2026-05-08 by Side Projects Agent
# → Hand to Claude Code CLI for review before any code is written
# Track: GOED Track 03 — The Founder's Navigator ($5,000)
# ─────────────────────────────────────────────────────────────────

## WHAT THIS IS
An AI-powered resource matching tool that takes a founder's context (stage, sector,
location, and goal) and returns the 5–7 most relevant Utah state resources — ranked,
explained, and linked. The system replaces browsing a 99-item library with a 30-second
intake flow that feels like asking an advisor who already knows your situation.

This is Shreyas's piece of a 4-person team. The other three members own:
- The Utah Startup Map (Track 04)
- Shared infrastructure / deployment / API keys
- UI polish and design system

Shreyas owns: intake flow, semantic matching engine, results presentation, admin reindex.

## THE INTERESTING ENGINEERING PROBLEM
Converting 4 quiz answers into a meaningful query vector without keyword overlap.

A founder who says "pre-revenue, SaaS, Salt Lake, funding" can't keyword-match to
"EPIC Ventures — partnered with University of Utah to support early-stage technology
companies" — there is zero lexical overlap. The system works by composing a natural
language profile string from the answers and embedding it, so semantic proximity
in vector space does what keyword matching can't.

The second non-trivial problem: location is a hard eligibility filter, not a soft
penalty. A founder in Carbon County must never see a Weber County-only resource in
their top 5 regardless of semantic score. Location filtering runs AFTER semantic
ranking and is an exclusion step, not a re-ranking step.

## OUTCOME — WHAT "DONE" LOOKS LIKE
- Live Vercel URL that works on Sunday afternoon
- All 6 GOED test cases (Jordan/Maria/Marcus/Priya/David/Dr. Amir) return
  meaningfully different results with no obviously wrong matches
- Each result card shows: resource name, link, category badge, and a
  personalized one-sentence explanation of why it fits this specific founder
- Admin reindex endpoint works: POST /api/admin/reindex re-embeds and reloads
  in-memory index without a server restart
- p50 response time under 3 seconds end-to-end (embed + match + LLM call)

## THE 6 TEST CASES (GOED will run these live on Sunday)
These are not suggestions — they are the judging rubric. Every design decision
must be validated against these six personas.

| # | Name | Location | Profile | Expected result type |
|---|------|----------|---------|---------------------|
| 1 | Jordan, 20 | SLC (Salt Lake County) | Pre-seed, idea only, first steps | Get Started grant, Lassonde, iHub — NOT VCs |
| 2 | Maria, 38 | Washington County | Rural, woman-owned, agriculture, scaling | Utah's Own, UDAF, Iron/Washington county resources, Rural+Women tags |
| 3 | Marcus, 34 | Weber County (Ogden) | Veteran, manufacturing, early-stage | Veteran registry, Utah MEP, iMpact Utah, Weber County resources |
| 4 | Priya, 31 | SLC | B2B SaaS, paying customers, raising first round | Salt Lake Angels, Park City Angels, Peterson Ventures, Pelion — NOT microloans |
| 5 | David, 45 | Utah County (Provo) | Medical device, 12 employees, FDA cleared, international expansion | WTC Utah, BioUtah, BIOHive, Utah County resources |
| 6 | Dr. Amir, 29 | SLC | PhD candidate at U of U, novel tech, commercializing, never started a business | EPIC Ventures (U of U partner), Lassonde, tech transfer path |

## MVP SCOPE

Builds first (must be done before end of Saturday morning):
- Parse resources.json from the provided spreadsheet (99 resources, pipe-delimited fields)
- Embedding pipeline: run once at startup, hold 99 vectors in memory as Float32Array
- /api/match endpoint: compose profile string → embed → cosine sim → location filter
  → topic boost re-rank → LLM explanation call → return top 5–7
- Intake flow UI: 4-step card-based quiz (stage, sector, location, goal)
- Results page: resource cards with name, link, category badge, personalized explanation
- Admin reindex: POST /api/admin/reindex, protected by ADMIN_SECRET env var

Deferred to Saturday afternoon (after core working):
- Dual-mode landing (Founder mode vs Investor/Explorer mode)
- Investor mode: skip quiz, show ecosystem overview (resource count by category, etc.)
- Loading states, error handling polish
- Mobile responsiveness polish

Cut entirely:
- User accounts, saved results, history
- Natural language freeform chat interface (4-question quiz is the UX)
- Real-time streaming of LLM explanation
- Any database — everything is in-memory from pre-computed JSON

## INTERVIEW PITCH (2 minutes)
"Most teams built a filter UI. Filters require founders to already know the vocabulary —
what's a CDFI, what's 'gap financing', which stage are they even in. We built a matching
engine. A founder answers four questions about themselves in plain language. We embed
their profile using OpenAI's text-embedding model and run cosine similarity against
every Utah resource, pre-embedded at startup. The interesting problem was location:
semantic similarity alone isn't enough — a founder in Carbon County should never see
a Salt Lake City coworking space in their top results regardless of how similar the
embeddings are. So we run semantic ranking first, then apply hard location eligibility
filters before returning results. Finally, one LLM call generates a personalized
one-sentence explanation for each result: not 'Utah Microloan Fund provides microloans'
but 'Maria, as a rural woman-owned agricultural business in Washington County, this
fund specifically serves founders who don't qualify for traditional bank financing.'"

## PORTFOLIO CONTEXT
Gap filled: first AI-powered retrieval system with a real civic/government use case.
Adds: semantic search with hard constraint filtering — a pattern that appears in
recommendation systems, e-commerce, and enterprise search at scale.
Roles strengthened: SDE + MLE both. The embedding/retrieval pipeline is MLE-relevant.
The API design, in-memory indexing, and constraint filtering is SDE-relevant.
New interview depth: "walk me through a retrieval system with hard business constraints"

## OPEN QUESTIONS FOR CLAUDE CODE REVIEW
[OPEN-1] Embedding model choice: OpenAI text-embedding-3-small (1536-dim, API call)
  vs fastembed BAAI/bge-small-en-v1.5 (384-dim, local ONNX). OpenAI is simpler to
  ship in a hackathon. fastembed eliminates API dependency and cold-start risk.
  Recommendation needed: which is safer for a hackathon under time pressure?

[OPEN-2] LLM for explanation generation: claude-sonnet-4-6 vs gpt-4o-mini.
  Cost is negligible at hackathon scale. Which is faster for a single-turn,
  tight-prompt explanation task? Claude has the advantage of being on-theme for a
  hackathon using Anthropic infrastructure.

[OPEN-3] In-memory vector store implementation: plain Float32Array with manual
  cosine sim loop vs a lightweight lib like vectra or hnswlib-node.
  At 99 resources, a brute-force cosine sim loop over Float32Array is ~0.1ms —
  no library needed. Confirm this assumption.

[OPEN-4] Profile string composition: exact template TBD. Needs to be rich enough
  to embed well, but not so long that it dilutes the signal. Draft:
  "I am a [stage] founder building a [sector] business in [county], Utah.
  I am looking for [goal]. [Community tag if applicable: I am a veteran / woman-owned
  / rural / student entrepreneur.]"
  Claude Code: stress-test this template against all 6 test cases before writing
  the implementation.

[OPEN-5] Location data mapping: the resource spreadsheet uses Utah county names.
  The intake quiz will ask for city or county. Need a city → county lookup table
  for the most common Utah cities (SLC, Provo, Ogden, St. George, Logan, Moab,
  Vernal, Price, Cedar City). Claude Code: build this lookup at the start of the
  implementation session.

[OPEN-6] Admin reindex security: ADMIN_SECRET env var checked against
  Authorization header. Is this sufficient for a hackathon demo, or should
  Claude Code implement a simple passphrase UI on the admin page instead?
