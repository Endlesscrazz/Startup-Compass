# Founder's Navigator — Phase Gates
# Generated: 2026-05-08 by Side Projects Agent
# Each gate requires explicit owner approval before proceeding.
# Claude Code does NOT move to the next phase autonomously.
# ──────────────────────────────────────────────────────────────────

## TIMELINE CONTEXT
Hackathon runs: Friday May 8, 1PM → Saturday May 9, 2PM (~25 hours)
Shreyas's available build time (estimated): ~12–14 focused hours
Deployment deadline: Saturday May 9, 12PM (leave 2 hours for demo prep)

## PHASE 0 — REVIEW SESSION (Before writing any code)
Duration: 30–45 minutes
Goal: Resolve all [OPEN] items. No code until this is done.

Tasks:
  □ Read project-spec.md, architecture.md, CLAUDE.md, DECISIONS.md
  □ Resolve OPEN-1: embedding model choice — document reasoning in DECISIONS.md
  □ Resolve OPEN-2: LLM choice — document reasoning in DECISIONS.md
  □ Resolve OPEN-3: confirm Float32Array perf — can do with a quick benchmark script
  □ Resolve OPEN-4: write out all 6 profile strings, review them together with owner
  □ Resolve OPEN-5: write city→county lookup table, confirm coverage
  □ Resolve OPEN-6: confirm admin auth approach
  □ Propose a session plan: one task per session with a testable outcome
  □ Flag any architectural concerns BEFORE building

⛔ GATE 0: Owner reviews resolved OPEN items and the session plan.
   "Looks good, proceed" required before Phase 1 begins.
   Do NOT start Phase 1 without this approval.

─────────────────────────────────────────────────────────────────

## PHASE 1 — DATA + EMBEDDING PIPELINE
Duration: 2–3 hours
Goal: resources.json is clean, embeddings.json is generated and committed.
      The index loads correctly in development.

Tasks:
  □ Parse the GOED spreadsheet (pipe-delimited fields) into resources.json
    Verify: all 99 resources present, communities/industries/locations/topics
    are proper string arrays (not pipe-joined strings)
  □ Write lib/counties.ts — city→county lookup table
    Verify: all 6 test case locations map correctly
    Jordan (SLC) → Salt Lake ✓
    Maria (Washington County) → Washington ✓
    Marcus (Ogden) → Weber ✓
    Priya (SLC) → Salt Lake ✓
    David (Provo) → Utah ✓
    Dr. Amir (SLC) → Salt Lake ✓
  □ Write lib/embed.ts — wraps embedding API, handles batching
  □ Write scripts/generate-embeddings.ts — run once, outputs embeddings.json
    Embedding string per resource:
    "[title]. [description]. Topics: [topics joined]. Communities: [communities joined]."
  □ Run the script, commit embeddings.json
  □ Write lib/index.ts — loads resources.json + embeddings.json into IndexEntry[] at module init
  □ Verify: console.log on startup shows "Index loaded: 99 resources"

⛔ GATE 1: Owner runs `npm run dev` and verifies index loads.
   Owner confirms embeddings.json is committed and not 0 bytes.
   "Index is loading correctly" required before Phase 2 begins.

─────────────────────────────────────────────────────────────────

## PHASE 2 — MATCHING ENGINE
Duration: 2–3 hours
Goal: POST /api/match returns correct results for all 6 test cases.
      This is the hardest part. Do not rush it.

Tasks:
  □ Write lib/profile.ts — composes profile string from MatchRequest
    Use the template resolved in OPEN-4.
    Test: call composeProfile() for each of the 6 test personas, print output.
    Owner reviews output before continuing.
  □ Write lib/match.ts — cosine similarity + location filter + topic boost
    Cosine sim: dot product / (norm(a) * norm(b)) — implement from scratch
    Location filter: resource.locations.includes(county) OR locations.length >= 20
    (statewide heuristic — confirm this with the data)
    Topic boost: +0.05 if goal maps to a resource topic, +0.05 for community match
    Return top 8 candidates before LLM step
  □ Write lib/explain.ts — calls Anthropic API with tight prompt
    System: "You generate concise resource recommendations for Utah startup founders.
             Given a founder profile and a list of resources, write ONE sentence per
             resource explaining specifically why it fits this founder's situation.
             Maximum 25 words per explanation. Be specific, not generic.
             Return a JSON array ONLY, no other text. Format:
             [{\"id\": 2543, \"explanation\": \"...\"}]"
    Test: run manually with 3 resources before wiring into the full pipeline
  □ Write app/api/match/route.ts — wires profile → embed → match → explain → response
  □ Write a test script: scripts/test-personas.ts
    Run all 6 test personas through the API, print results.
    Owner reviews: do Maria's results include Washington County resources?
    Does Jordan NOT see VC firms? Does Priya NOT see microloans?

⛔ GATE 2: Owner runs test-personas.ts and reviews output for all 6 personas.
   Acceptance criteria:
   - All 6 return 5–7 results
   - No obviously wrong matches (Jordan gets VCs, Maria gets SLC coworking)
   - Response time under 5 seconds (3s target, 5s acceptable for demo)
   - Explanations are specific, not generic
   "Results look correct for all 6 test cases" required before Phase 3 begins.
   If any test case fails, fix it in Phase 2 — do not carry broken matching into the UI.

─────────────────────────────────────────────────────────────────

## PHASE 3 — INTAKE QUIZ UI
Duration: 2 hours
Goal: The 4-step quiz works end-to-end and submits to /api/match.

Tasks:
  □ Build components/QuizStep.tsx — single step card with question and tappable options
  □ Build app/quiz/page.tsx — manages step state, handles multi-select for community tags
    Step 1: Stage (4 options, single select)
    Step 2: Sector (7 options, single select)
    Step 3: Location (text input with county suggestion — use counties.ts client-side)
    Step 4: Goal (5 options, single select) + Community tags (multi-select checkboxes)
  □ On submit: POST to /api/match with MatchRequest payload
  □ On success: navigate to /results with results in URL query params or
    sessionStorage [OPEN: decide which approach is cleaner for a hackathon]
  □ Loading state: spinner/skeleton while waiting for API response
  □ Error state: "Something went wrong, please try again" with retry button

⛔ GATE 3: Owner walks through the quiz for Marcus (veteran, Weber County, manufacturing)
   and confirms the correct results page appears.
   "Quiz submits correctly and results page loads" required before Phase 4 begins.

─────────────────────────────────────────────────────────────────

## PHASE 4 — RESULTS PAGE UI
Duration: 2 hours
Goal: Results look investor-demo quality. This is what the judges will stare at.

Tasks:
  □ Build components/CategoryBadge.tsx — colored badge for resource category
    Funding → green, Community → blue, Workspace → purple,
    Growth → orange, Events → gray
  □ Build components/ResultCard.tsx — one resource card
    Required fields: name (linked), category badge, personalized explanation (prominent),
    contact email if available
  □ Build app/results/page.tsx — grid of 5–7 ResultCard components
    Include: "Based on your profile" summary line at top
    Include: "Start over" link back to quiz
  □ Polish: clean whitespace, readable at a glance, works on a laptop screen
    (mobile can be imperfect — prioritize desktop for demo)
  □ Add: profileString displayed in a collapsed "debug" section (helps during demo
    if a judge asks "how does it work" — shows the actual string that was embedded)

⛔ GATE 4: Owner demo-walks all 6 test personas end-to-end.
   Acceptance criteria:
   - Results page looks polished enough for an investor demo
   - Category badges are correct
   - Explanations are readable and specific
   - No layout breaks or console errors
   "Ready to demo" required before Phase 5 begins.

─────────────────────────────────────────────────────────────────

## PHASE 5 — ADMIN + DEPLOYMENT
Duration: 1 hour
Goal: Deployed to Vercel with a live URL. Admin reindex works.

Tasks:
  □ Write app/api/admin/reindex/route.ts
  □ Write app/admin/page.tsx — simple form: "Reindex resources" button + status display
  □ Set up Vercel project, add env vars (OPENAI_API_KEY, ANTHROPIC_API_KEY, ADMIN_SECRET)
  □ Deploy. Verify live URL works.
  □ Run all 6 test personas against the live URL (not localhost)
  □ Share URL with team

⛔ GATE 5: Owner verifies live URL, runs 2 test personas on deployed site.
   "Live and working" required before Phase 6 begins.

─────────────────────────────────────────────────────────────────

## PHASE 6 — DEMO PREP (Saturday morning, final hour)
Duration: 30 minutes of structured prep
Goal: Owner can demo the tool confidently in 2 minutes under pressure.

Tasks:
  □ Prepare 3 demo personas (not all 6 — pick the most visually different):
    Suggested: Jordan (idea stage), Maria (rural, Washington County), Priya (raising a round)
  □ Practice the 2-minute pitch from project-spec.md
  □ Know the answer to: "How does it work technically?" (4 sentences)
  □ Know the answer to: "How is this different from just filtering?" (2 sentences)
  □ Know the answer to: "What happens when new resources are added?" (1 sentence)
  □ Have the /admin page open in a tab — if a judge asks about updatability, demo it live

## WHAT CLAUDE CODE MUST NOT DO
- Do NOT start Phase 1 without Gate 0 approval
- Do NOT start Phase 3 without Gate 2 passing (broken matching + nice UI = still a loss)
- Do NOT add features not in this spec without owner approval
- Do NOT add a database
- Do NOT build a chatbot interface
- Do NOT attempt to build the Startup Map — that's another team member's piece
- Do NOT over-engineer the admin UI — it's a one-button form
- Do NOT spend more than 30 minutes debugging any single issue — flag it and move on
