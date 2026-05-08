# Founder's Navigator — Decisions Log
# Maintained by Claude Code. Do not edit manually.
# Format: [DECISION-N] Date | Decision | Reason | Trade-off
# ──────────────────────────────────────────────────────────

## LOCKED (from pre-build design — do not re-litigate)

[DECISION-1] 2026-05-08 | Interface model: 4-step quiz, not freeform chatbot
  Reason: Chatbots are slow to demo and hard to evaluate against 6 specific test cases.
  Quiz produces consistent, reproducible input that can be validated.
  Trade-off: Less flexible — founder must fit their situation into 4 questions.

[DECISION-2] 2026-05-08 | Location filtering: hard exclusion, not soft penalty
  Reason: A result that can't be acted on because of geography is worse than no result.
  Maria in Washington County must never see Salt Lake City resources at rank 1.
  Trade-off: May exclude resources that are "technically" statewide but listed with
  fewer than 29 counties — requires verifying the data.

[DECISION-3] 2026-05-08 | LLM is explanation layer only — not the matching engine
  Reason: LLM matching is non-deterministic, slow, and fails under judge scrutiny.
  Embedding cosine sim is deterministic, fast, and explainable.
  Trade-off: LLM explanation quality depends on the ranking already being correct.
  If the semantic match fails, the LLM can't save it.

[DECISION-4] 2026-05-08 | Commit embeddings.json to repo (no cold-start reindex)
  Reason: Hackathon constraint. Zero cold-start latency is worth the cost of
  having vectors in version control.
  Trade-off: embeddings.json must be regenerated and recommitted if resources change.

[DECISION-5] 2026-05-08 | No database — everything in-memory from JSON files
  Reason: 99 resources is a trivial dataset. A database adds deployment complexity
  with zero benefit at this scale.
  Trade-off: Server restarts lose any runtime-added resources (admin reindex re-loads
  from resources.json, which is the source of truth).
  UPDATE 2026-05-08: Dataset has 213 resources, not 99. Decision still holds —
  213 × 1536-dim vectors = ~1.3MB, trivially in-memory.

## RESOLVED (Phase 0 — 2026-05-08)

### [DECISION-6] 2026-05-08 | Embedding provider: Google Gemini text-embedding-004 (free tier)

**What was decided:**
Use Gemini `text-embedding-004` (768-dim) for both resource pre-embedding and live
profile embedding. Provider is abstracted behind `lib/embed.ts` so it can be swapped
to OpenAI `text-embedding-3-small` (1536-dim) by changing one env var and one import.

**Why this approach:**
Free tier (1,500 req/day, ~100 RPM) is sufficient for hackathon scale — 213 resources
pre-embedded once at script time, then only 1 embed call per user request at runtime.
fastembed was rejected because ONNX native binaries do not survive Vercel's serverless
build environment. OpenAI was rejected to avoid paid API dependency.
Gemini embedding quality at 768-dim is strong for descriptive government resource text.

**Alternatives considered:**
- OpenAI text-embedding-3-small (1536-dim): better known, slightly higher quality,
  but paid. Can be swapped in — see PROVIDER-SWAP.md.
- fastembed (local ONNX): no API dependency, but breaks on Vercel. Rejected.
- Cohere embed-english-light (384-dim): free but lower dimension / quality. Rejected.

**Trade-off accepted:**
768-dim vs 1536-dim. At 213 resources the quality difference is negligible.
Rate limit during pre-computation: 213 calls at ~100 RPM requires a ~700ms delay
between calls in the generate-embeddings script (~2.5 min total). One-time cost.

**How to explain in an interview:**
"Embeddings are a pure function of the input text — switching providers means
regenerating embeddings.json and updating one config line. We abstracted the
provider behind a single embed() function precisely so this swap is a 10-minute
operation, not a codebase refactor."

---

### [DECISION-7] 2026-05-08 | LLM provider: Groq + llama-3.3-70b-versatile (free tier)

**What was decided:**
Use Groq's API with `llama-3.3-70b-versatile` for generating personalized one-sentence
explanations. Provider is abstracted behind `lib/explain.ts` so it can be swapped to
Anthropic claude-sonnet-4-6 or OpenAI gpt-4o-mini by changing one env var + import.

**Why this approach:**
Groq's LPU inference is the fastest available for 70B-class models — typically 300–500ms
per call. The LLM explanation call is the single biggest latency contributor in the
pipeline. At this speed, p50 response time comfortably hits <3s even with the embed
call preceding it. Free tier: 14,400 req/day, generous token limits.

Groq has no embedding API — that's why Gemini handles embeddings separately.

**Alternatives considered:**
- Anthropic claude-sonnet-4-6: excellent JSON adherence, on-theme for hackathon, but paid.
  Can be swapped in — see PROVIDER-SWAP.md.
- Gemini 2.0 Flash Lite: free, good quality, but ~1.5s vs Groq's ~0.4s. Rejected for speed.
- OpenAI gpt-4o-mini: paid. Rejected.

**Trade-off accepted:**
llama-3.3-70b occasionally outputs JSON wrapped in markdown fences. explain.ts MUST
strip markdown before JSON.parse() — this is a runtime crash if skipped:
  const clean = raw.replace(/^```json\s*/,'').replace(/\s*```$/,'').trim()
If Groq call fails: fall back to truncated resource description (25 words). Never
block the full response on explanation failure.

**How to explain in an interview:**
"We used Groq's inference API because it's the fastest way to run a 70B model —
sub-500ms per call. The LLM is a pure explanation layer: if it fails, we return
results with the resource's own description. The ranking is never LLM-dependent."

---

### [DECISION-8] 2026-05-08 | Profile string template — fixed and finalized

**What was decided:**
Use a stage-aware, goal-specific profile string template with three key fixes:
(1) county name collision fix, (2) stage descriptors, (3) goal-specific phrases.

**Why this approach:**
The naive template ("I am a [stage] founder in [county], Utah looking for [goal]")
produces nearly identical strings for Jordan (idea, start a business) and Dr. Amir
(idea, start a business, student). Amir must land near Epic Ventures / tech transfer
resources; Jordan must land near beginner-friendly grants. Without stage descriptors
and student-specific language, the embedding cannot distinguish them.

The "Utah County" collision is critical: embedding "in Utah, Utah" is ambiguous —
the model sees the state name twice. Always use "{county} County" in the string.

**Final template (implemented in lib/profile.ts):**
```
I am a {STAGE_DESCRIPTOR} building a {sector} business in {city} ({county} County), Utah.
I am looking for {GOAL_PHRASE}.
{COMMUNITY_CONTEXT if any}
```

STAGE_DESCRIPTOR map:
  idea + student  → "first-time founder exploring commercializing university research or novel technology"
  idea            → "first-time founder at the idea stage learning how to start a business"
  building        → "pre-revenue early-stage founder actively building a product or service"
  revenue         → "growth-stage founder with paying customers seeking to scale"
  growth          → "established business owner with employees and revenue looking to expand"

GOAL_PHRASE map:
  Start a Business    → "guidance on how to launch and start my business for the first time"
  Funding (idea/bld)  → "grants, early-stage funding, and startup competitions"
  Funding (rev/grwth) → "venture capital, angel investment, or growth financing"
  Mentorship          → "mentorship, peer networks, and entrepreneurship community programs"
  Workspace           → "coworking space, maker space, or business incubator facilities"
  International       → "international trade support, export resources, and global market access"
  Scaling             → "resources to scale and grow my established business with employees"

COMMUNITY_CONTEXT examples:
  veteran  → "I am a veteran entrepreneur."
  women    → "My business is woman-owned."
  rural    → "I operate in a rural area."
  student  → "I am a university student or researcher."

**Alternatives considered:**
Free-text input from founders — rejected (quiz is the locked UX).
Single generic goal phrase — rejected (conflates VC funding with grants).

**Trade-off accepted:**
Template quality is the weakest link in the pipeline. A founder who describes
themselves as "idea stage" when they actually have paying customers will get
mismatched results. We cannot validate the founder's self-description.

**How to explain in an interview:**
"The profile string template is effectively a prompt engineering problem. We spent
real time making sure 'idea-stage student commercializing research' produces a
different embedding than 'idea-stage founder starting a restaurant'. The goal
phrases are stage-aware — a growth-stage founder looking for funding gets 'venture
capital and growth financing' in their profile string, not 'grants and startup
competitions', so the embedding lands in a completely different part of the vector
space."

---

### [DECISION-9] 2026-05-08 | Resource embedding string includes Industries field

**What was decided:**
Embed each resource using:
  "{title}. {description}. Industries: {industries}. Topics: {topics}. Communities: {communities}."

**Why this approach:**
Without the Industries field, Priya (SaaS) and David (Life Sciences) rely entirely
on semantic similarity in the description text to surface sector-specific resources.
Many VC/angel resources have short descriptions that don't mention "SaaS" explicitly
but DO have "Software and Information Technology" in their Industries metadata.
Including the field in the embedding string makes the vector space reflect industry
alignment directly.

**Trade-off accepted:**
Longer embedding strings cost marginally more tokens. At 213 resources this is ~$0.01.
Negligible.

---

### [DECISION-10] 2026-05-08 | Scoring formula uses multiplier for topic/industry/community boost

**What was decided:**
  final_score = cosine_sim × (1 + 0.10 × topicMatch + 0.10 × industryMatch + 0.10 × communityMatch)

Instead of: final_score = cosine_sim + 0.05 (additive)

**Why this approach:**
Cosine similarity scores for good matches cluster in the 0.80–0.95 range. An
additive +0.05 boost represents ~5–6% of that range and may not reorder results.
A multiplicative boost scales with the base similarity — a resource that is both
semantically close AND has a topic/industry/community match gets proportionally
more lift. Max boost is ×1.30 (all three match), which meaningfully reorders within
the candidate pool without overwhelming semantic similarity.

topicMatch: resource.topics includes the goal's mapped topic
industryMatch: resource.industries includes the request's mapped sector
communityMatch: resource.communities includes request community tag(s) OR equals "Any"

**Trade-off accepted:**
Multiplier adds a tiny amount of complexity vs additive. Worth it to ensure boosts
actually affect ranking.

---

### [DECISION-11] 2026-05-08 | UI component library: shadcn/ui + Tailwind

**What was decided:**
Use shadcn/ui for all UI components. Design language: Utah state palette
(deep red #CC0000, navy #003087, white, light gray #F5F5F5).

**Why this approach:**
Design & Visual Impact is 25% of judging criteria. Raw Tailwind built fast looks
like raw Tailwind built fast. shadcn/ui gives production-quality components
(cards, badges, buttons, progress) with copy-paste speed. No runtime library
dependency — components are copied into the project as source files.

**Trade-off accepted:**
shadcn requires an initial setup step (npx shadcn init). ~15 minutes, front-loaded
before Phase 3. Worth it for 25% of judging weight.

---

### [DECISION-12] 2026-05-08 | "Any" community tag always matches community boost

**What was decided:**
In the scoring formula, if resource.communities includes "Any", the community boost
fires regardless of what the founder's community tags are (including no tags at all).

**Why this approach:**
22 resources have Communities: "Any". These are intentionally open to everyone.
Under the original logic, a founder with no community tags would never get a
community boost for these resources even though they are eligible. "Any" means
any founder — the boost should reflect that.

**Trade-off accepted:**
"Any" resources get a slight scoring lift for all founders. This is correct behavior —
these resources chose to be universally applicable.

---

### [DECISION-13] 2026-05-08 | Dataset has 213 resources (not 99 as specified)

**What was decided:**
All references to "99 resources" in the codebase, comments, and interview pitch
must be updated to 213. The in-memory architecture and performance estimates are
unchanged — 213 × 1536-dim vectors = ~1.3MB, brute-force cosine sim takes ~0.3ms.

**Why this matters:**
The project spec and architecture.md both say "99 resources". The actual GOED
spreadsheet has 213 rows (after removing the header). The interview pitch must
reflect the real number.

---

### [DECISION-14] 2026-05-08 | iHub location data issue — flag to organizers

**What was decided:**
iHub is listed in the GOED dataset with a single location: Utah County. The test
case for Jordan (SLC, idea stage) expects iHub to appear in results. A Salt Lake
County founder will never see iHub under our hard location exclusion rule.

Action: At the hackathon, flag this to the GOED organizers and request they confirm
whether iHub should serve Salt Lake County founders. If yes, patch resources.json
to add Salt Lake County to iHub's locations before generating embeddings. If no,
update the Jordan test expectation — Jordan will see Lassonde + Get Started +
other SLC-eligible early-stage resources instead.

Do NOT silently remove the location filter to make iHub appear for SLC — that
would break Maria's test case (she must NOT see SLC-only resources).

**Trade-off accepted:**
If we cannot reach the organizers, we accept Jordan not seeing iHub and document
the data discrepancy. The matching engine is correct — the data may not be.

---

## OPEN
(All items resolved above. No remaining open items.)
