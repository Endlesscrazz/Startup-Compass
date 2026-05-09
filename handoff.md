---
# Handoff — Startup Compass / Founder's Navigator
Date: 2026-05-08
Session: 3 complete. Session 4 planned, not started.

## Current branch
shreyas/quiz-results-ui — all work goes here, PR to main when done.

## Completed (Sessions 1–3)
- data/resources.json — 211 resources
- data/embeddings.json — 211 × 3072-dim (Gemini gemini-embedding-001)
- src/lib/index.ts — module singleton, Float32Array
- src/lib/counties.ts — city→county lookup (60+ cities)
- src/lib/profile.ts — stage-aware profile string composer
- src/lib/embed.ts — Gemini embed client
- src/lib/match.ts — cosine sim + statewide filter + multiplicative boost
- src/lib/explain.ts — Groq llama-3.3-70b + prompt injection defence (DECISION-18)
- src/lib/sanitize.ts — NL input sanitizer (ready to use in Session 4)
- src/app/api/match/route.ts — full quiz pipeline
- src/app/api/ping/route.ts — health check
- src/app/navigator/ — QuizClient.tsx (4-step quiz) + page.tsx
- src/app/results/ — ResultsClient.tsx + page.tsx
- src/components/ResultCard.tsx + CategoryBadge.tsx
- DECISIONS.md — decisions 1–18

## Session 4 — NL Input + Voice (NEXT)
See PROJECT-TASKS.md §4 for detailed tasks. Summary:

1. Extend /api/match to accept { description, city } as Path B
   - sanitizeDescription() already in src/lib/sanitize.ts
   - Pass null/[] for goal/sector/community → boost = ×1.0 (pure cosine)
   - rankResources signature already supports null goal (check it)

2. Build src/app/navigator/NLClient.tsx
   - textarea (maxLength=500) + char counter
   - city input
   - mic button (Web Speech API, hidden if unavailable)
   - sessionStorage: { description, city } → router.push('/results')

3. Add tab toggle to /navigator — [Step-by-step] | [Describe your situation]

4. Update ResultsClient to handle both sessionStorage shapes

## Session 5 — personas_eval.py (after Session 4)
- Fix personas.json: add description + city fields per persona
- Wire get_top_results() to POST http://localhost:3000/api/match
- Add LLM-as-Judge via Groq (GROQ_API_KEY already in .env.local)
- Fuzzy mustNotSee/expect matching (substring, not exact)
- Print scorecard

## Must-know context
1. EMBEDDING_DIM = 3072 — not 768, not 1536
2. Resource count = 211
3. API response: { results[], profileString, county }
   results: { id, title, description, explanation, link, email, topics, communities, score }
4. Quiz → API body: { stage, sector, city, goal, community[] }
   NL → API body: { description, city }
5. Community label normalization in route.ts: "Woman-owned"→"Women" etc.
6. iHub: locations=["Utah"] treated as statewide (DECISION-16, match.ts)
7. Dr. Amir must pick goal=Funding + community=Student to surface Lassonde/iHub
8. Groq key confirmed working. Gemini key confirmed working.
9. text-surface Tailwind v4 bug: use text-[#fbf7f0] for buttons with bg-ink
10. globals.css: base styles now inside @layer base so Tailwind utilities take precedence

## Open questions
- rankResources() signature: check if null goal/sector breaks the boost logic
  (it shouldn't — GOAL_TO_TOPIC[null] → undefined → topicMatch = false → no boost)
- Vercel deploy: push branch after Session 4 is complete, not before
---
