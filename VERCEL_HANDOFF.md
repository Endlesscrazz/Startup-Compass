# Vercel deploy handoff (Startup Compass)

Use this after merging to `main` so Shreyas’s team can deploy and test on their Vercel project.

## 1. Vercel project

- Import the GitHub repo and select **`main`** as the Production Branch (or merge your PR first).
- Framework: **Next.js** (default). Root directory: repo root.
- Build command: **`npm run build`** (runs `prisma generate` + `next build`).

## 2. Stable URL vs one-off deployment URL

A URL like  
`https://startup-compass-l8zaql73w-shreyas-projects-843f684c.vercel.app`  
is tied to **one deployment** and **changes** when you redeploy.

For **OAuth, metadata, and deep links**, use the **Production domain** from:

**Vercel → Project → Settings → Domains**

(often `https://startup-compass-one.vercel.app` or a custom domain).  
Set `NEXT_PUBLIC_APP_URL` and `AUTH_URL` to that **stable** origin (no trailing slash).

## 3. Required environment variables (Production)

Copy from `.env.example` and fill in Vercel → **Settings → Environment Variables** (Production; add Preview if you want previews to work the same).

| Variable | Notes |
|----------|--------|
| `DATABASE_URL` | Postgres (Neon / Supabase / etc.). Then run **`npx prisma migrate deploy`** once against that DB (CI, local, or Vercel build step). |
| `AUTH_SECRET` | Strong random secret (`openssl rand -base64 32`). |
| `NEXT_PUBLIC_APP_URL` | Stable production origin, e.g. `https://startup-compass-one.vercel.app` |
| `AUTH_URL` | Same as `NEXT_PUBLIC_APP_URL` if NextAuth redirects misbehave on Vercel. |
| `GEMINI_API_KEY` | Quiz / match embeddings. |
| `GROQ_API_KEY` | Result explanations (and optional intelligence LLM). |
| `ADMIN_SECRET` | Protects `POST /api/admin/reindex`. |

Optional: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` (must be  
`{ORIGIN}/api/integrations/gmail/callback` and listed in Google Cloud **Authorized redirect URIs**), Twilio vars, etc.

## 4. Database migration (first deploy)

With `DATABASE_URL` set in Vercel (or locally pointing at the same DB):

```bash
npx prisma migrate deploy
```

You can run this locally against the production connection string, or add a one-off **Deploy Hook** / CI step. Without applied migrations, API routes that use Prisma may return 500 JSON errors.

## 5. Google OAuth (if using “Continue with Google”)

In Google Cloud Console → OAuth client (Web application), add:

- `{NEXT_PUBLIC_APP_URL}/api/auth/callback/google`
- `{NEXT_PUBLIC_APP_URL}/api/integrations/gmail/callback` (if using Gmail connect)

## 6. Smoke test

- `/` and `/login` (demo user if Google not configured).
- `/navigator` → match flow (needs `GEMINI_API_KEY` + `GROQ_API_KEY`).
- `/dashboard`, `/watchlist`, `/briefs-alerts` with `DATABASE_URL` set.

## 7. Merge checklist for the repo owner

- [ ] All changes pushed to a branch and PR into **`main`**.
- [ ] Vercel env vars set on the team project.
- [ ] `prisma migrate deploy` run against production DB.
- [ ] Redeploy Production after env / migration changes.
