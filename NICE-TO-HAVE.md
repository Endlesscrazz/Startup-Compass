# Startup Compass — Nice-to-Have Features
# Features scoped but deferred. Circle back after core demo is stable.
# Owner: Shreyas Patil
# ──────────────────────────────────────────────────────────────────

## UI / POLISH

### Mobile responsiveness polish
- Current state: desktop-first, works but not optimized below 640px
- What's needed: quiz option cards stack correctly on 375px, result cards full-width,
  share buttons don't overflow, NL textarea padding on mobile
- Effort: ~45 min
- Priority: medium (demo is on laptop, but Tyler mentioned mobile in feedback)

### Real-time LLM streaming
- Current state: wait for full JSON array of explanations before rendering
- What's needed: stream individual explanation tokens as they arrive,
  show cards progressively as explanations complete
- Blocker: requires JSON streaming + partial parse logic (non-trivial)
- Effort: 2–3 hours
- Priority: low (p50 is already < 3s, streaming is cosmetic at this scale)

---

## MATCHING QUALITY

### Outreach draft per result card
- What: "Draft an email to this resource" button on each ResultCard
- Teammate already built OutreachDraftModal in src/components/founder/OutreachDraftModal.tsx
- What's needed: wire it into ResultCard with founder profile context + resource context
- Requires: careful prompt engineering so emails are specific, not generic
- Effort: 1–2 hours (prompting + integration + testing)
- Priority: high for differentiation — defer until after Vercel deploy is stable
- Note: do NOT build until deploy is working — risky to add complexity pre-demo

### Marcus/David matching quality gaps
- VBRC and Utah MEP not ranking in top 8 for Marcus despite statewide eligibility
  → Root cause: profile string "pre-revenue manufacturing veteran" doesn't produce
    high cosine similarity against VBRC's description. Could try adding explicit
    "veteran-owned business resources" phrase to profile for Veteran community tag.
- BioUtah / BIOHive not ranking for David (Utah Co, life sciences, international)
  → Root cause: their topics are only "Entrepreneurship Communities" + "Late Stage Growth",
    not "Life Sciences" industry tag. Consider manually adding industry tags to these
    two resources in resources.json and regenerating embeddings.
- Wildcat MicroFund appearing for David (biotech, international) — wrong fit
  → Root cause: Wildcat has "International Trade" topic + 29 counties → passes filter + gets boost
  → Fix: remove "International Trade" from Wildcat's topics in resources.json
- Effort per fix: 10–15 min each + re-embed
- Priority: medium — 4/6 personas are strong, fix these before Vercel if time allows

### "Not relevant" feedback button
- Thumbs-down on each result card saves to localStorage
- Filtered out on next search from same browser
- Effort: 30 min
- Priority: low (demo audience is judges, not repeat users)

---

## DISCOVERABILITY / STICKINESS

### "Similar to this" exploration
- Click a resource card → "Show me more like this" → re-runs match with that
  resource's embedding as the query vector instead of the founder profile
- Effort: 1 hour
- Priority: low

### Resource freshness timestamps
- Add "Last verified: [date]" to each resource card
- Requires: add verified_at field to resources.json
- Effort: 15 min (data) + 10 min (UI)
- Priority: low

---

## INFRASTRUCTURE

### Vercel deployment ← DO THIS BEFORE DEMO
- Not a nice-to-have — this is blocking. Listed here as reminder.
- Env vars needed: GEMINI_API_KEY, GROQ_API_KEY, ADMIN_SECRET
- Branch to deploy: shreyas/quiz-results-ui (or main after merge)

### Rate limiting on /api/match
- Current state: no rate limiting — open to abuse
- What's needed: simple IP-based rate limit (e.g. 10 req/min via Vercel middleware)
- Effort: 30 min
- Priority: low for hackathon, important post-demo

---

## JUDGE Q&A PREP (not a feature — action item)
- Practice 2-min pitch from project-spec.md INTERVIEW PITCH section
- Memorize 5 judge Q&As from SESSION 7 in PROJECT-TASKS.md
- Preload browser tabs: landing / /navigator / /navigator (NL tab) / /admin / /results (Priya pre-run)
