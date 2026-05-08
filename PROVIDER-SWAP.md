# Provider Swap Guide
# Startup Compass — Founder's Navigator
# ─────────────────────────────────────────────────────────────────
# The embedding provider and LLM provider are fully abstracted.
# This file documents exactly how to swap either one.
# No other files need to change.
# ─────────────────────────────────────────────────────────────────

## Current Providers (default / free tier)

| Role | Provider | Model | SDK package |
|------|----------|-------|-------------|
| Embeddings | Google Gemini | text-embedding-004 (768-dim) | @google/generative-ai |
| LLM | Groq | llama-3.3-70b-versatile | groq-sdk |

---

## How to Swap the Embedding Provider

All embedding logic lives in `lib/embed.ts`.
The function signature never changes — only the implementation inside.

### Current signature (do not change)
```typescript
// lib/embed.ts
export async function embedText(text: string): Promise<Float32Array>
export async function embedBatch(texts: string[]): Promise<Float32Array[]>
```

### Option A — Keep Gemini (default)
```
GEMINI_API_KEY=your-key-here   # in .env
```
Model: `text-embedding-004`, output dimension: **768**

### Option B — Swap to OpenAI
1. Set env var: `OPENAI_API_KEY=sk-...`
2. In `lib/embed.ts`, swap the implementation to the OpenAI block (see comments in file)
3. Change `EMBEDDING_DIM` constant from `768` to `1536`
4. **Re-run the embedding script**: `npx tsx scripts/generate-embeddings.ts`
5. Commit the new `data/embeddings.json`

```
# .env changes
# GEMINI_API_KEY=...       ← comment out or remove
OPENAI_API_KEY=sk-...      ← add this
EMBEDDING_PROVIDER=openai  ← signals lib/embed.ts which branch to use
```

OpenAI model: `text-embedding-3-small`, output dimension: **1536**

**Why you must regenerate embeddings.json:**
Resource vectors and the profile vector must use the same model and dimension.
If you swap the provider, you MUST regenerate all resource vectors or cosine
similarity scores will be meaningless (different vector spaces are incompatible).

### Option C — Swap to Cohere
1. Set env var: `COHERE_API_KEY=...`
2. Swap implementation in `lib/embed.ts` to Cohere block
3. `EMBEDDING_DIM = 384`
4. Re-run embedding script, commit new embeddings.json

---

## How to Swap the LLM Provider

All LLM logic lives in `lib/explain.ts`.
The function signature never changes.

### Current signature (do not change)
```typescript
// lib/explain.ts
export async function generateExplanations(
  founderProfile: string,
  candidates: Resource[]
): Promise<Map<number, string>>   // resource id → explanation string
```

### Option A — Keep Groq (default)
```
GROQ_API_KEY=gsk_...   # in .env
```
Model: `llama-3.3-70b-versatile`

### Option B — Swap to Anthropic Claude
1. Set env var: `ANTHROPIC_API_KEY=sk-ant-...`
2. In `lib/explain.ts`, swap implementation to Anthropic block (see comments)
3. No need to regenerate embeddings — LLM swap is independent of embeddings

```
# .env changes
# GROQ_API_KEY=...              ← comment out or remove
ANTHROPIC_API_KEY=sk-ant-...    ← add this
LLM_PROVIDER=anthropic          ← signals lib/explain.ts which branch to use
```

Model: `claude-sonnet-4-6`

### Option C — Swap to OpenAI
```
OPENAI_API_KEY=sk-...
LLM_PROVIDER=openai
```
Model: `gpt-4o-mini`

Note: Groq is also OpenAI API-compatible. If you want to use the OpenAI SDK pointed
at Groq's endpoint, set `OPENAI_BASE_URL=https://api.groq.com/openai/v1` — this
works without changing any SDK code.

---

## Environment Variable Reference

### .env for default (free tier — Option B providers)
```bash
GEMINI_API_KEY=your-gemini-key
GROQ_API_KEY=your-groq-key
ADMIN_SECRET=your-reindex-secret
```

### .env for OpenAI + Anthropic (paid)
```bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
EMBEDDING_PROVIDER=openai
LLM_PROVIDER=anthropic
ADMIN_SECRET=your-reindex-secret
```

### .env for OpenAI + Groq (mixed)
```bash
OPENAI_API_KEY=sk-...
GROQ_API_KEY=gsk_...
EMBEDDING_PROVIDER=openai
LLM_PROVIDER=groq
ADMIN_SECRET=your-reindex-secret
```

---

## Swap Checklist

### Swapping embeddings provider
- [ ] Update `.env` with new API key
- [ ] Set `EMBEDDING_PROVIDER` env var
- [ ] Run `npx tsx scripts/generate-embeddings.ts`
- [ ] Verify `data/embeddings.json` is non-zero and has correct count (213 entries)
- [ ] Commit new `data/embeddings.json`
- [ ] Run `npx tsx scripts/test-personas.ts` — all 6 personas must still pass
- [ ] Update `EMBEDDING_DIM` constant in `lib/embed.ts` if dimension changed

### Swapping LLM provider
- [ ] Update `.env` with new API key
- [ ] Set `LLM_PROVIDER` env var
- [ ] Run `npx tsx scripts/test-personas.ts` — check explanation quality
- [ ] No re-embedding needed

---

## Performance Reference

| Provider | Model | Dim | Embed latency | LLM latency | Cost |
|----------|-------|-----|--------------|-------------|------|
| Gemini | text-embedding-004 | 768 | ~200ms | — | Free |
| OpenAI | text-embedding-3-small | 1536 | ~100ms | — | Paid |
| Groq | llama-3.3-70b | — | — | ~400ms | Free |
| Anthropic | claude-sonnet-4-6 | — | — | ~1500ms | Paid |
| OpenAI | gpt-4o-mini | — | — | ~800ms | Paid |

Expected p50 end-to-end with default (Gemini + Groq): **~800ms–1.5s**
Expected p50 end-to-end with OpenAI + Anthropic: **~1.8s–3s**
