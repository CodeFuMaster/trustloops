# Deploy Checklist (TrustLoops / TestimonialHub)

This guide connects API → Fly.io, Web → Cloudflare Pages, and configures Supabase and LemonSqueezy.

## 1) Prereqs
- Domains: trustloops.app (Cloudflare DNS)
- GitHub repo secrets set:
  - Fly: `FLY_API_TOKEN`
  - Cloudflare: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_PROJECT_NAME`
  - Supabase: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_ANON_KEY`, `JWT_SECRET`
  - LemonSqueezy: `LEMONSQUEEZY_WEBHOOK_SECRET`

## 2) API → Fly.io
- Install flyctl and login:
  - fly auth login
- Create apps:
  - Prod: `fly apps create trustloops-api`
  - Staging: `fly apps create trustloops-api-staging`
- Set secrets (prod & staging):
  - fly secrets set SUPABASE__Url=... SUPABASE__ServiceKey=... SUPABASE__JwtSecret=...
  - fly secrets set LemonSqueezy__WebhookSecret=...
- Deploy (from CI or locally):
  - Prod: push to `main`
  - Staging: push to `staging`
- DNS (Cloudflare): CNAME `api` → Fly app hostname; optional `staging-api` for staging.

## 3) Web → Cloudflare Pages
- Create Pages project → connect GitHub, or use GH workflow provided.
- Set project env vars (if using CF build):
  - `VITE_API_URL` → https://api.trustloops.app (prod), https://staging-api.trustloops.app (stg)
  - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- If using the workflow `deploy-web.yml`, ensure repo secrets above are present.
- DNS: point root and www to Pages (orange-cloud proxied).

## 4) Supabase config
- Auth redirect URLs: https://trustloops.app, https://staging.trustloops.app, http://localhost:5173
- Storage buckets created per migrations; run migrations from `supabase/migrations`.
- RLS policies as defined; verify anon keys.

## 5) Backend CORS
- `AllowedOrigins` includes localhost, staging, and prod. In Fly we pass via env (see `fly.toml`).

## 6) LemonSqueezy Webhook
- In LemonSqueezy, set webhook to: `https://api.trustloops.app/api/webhooks/lemonsqueezy`
- Same for staging with staging hostname: `https://staging-api.trustloops.app/api/webhooks/lemonsqueezy`.
- Secret must match `LemonSqueezy:WebhookSecret` in API.

## 7) Smoke test (staging then prod)
1. Create project
2. Record/upload testimonial (or stub)
3. Approve it
4. View wall and embed widget
5. Run AI enrichment (Pro plan path) or verify gating
6. Check analytics counters

## 8) Troubleshooting
- Fly logs: `fly logs -a trustloops-api`
- Health endpoint: `GET /health`
- CORS errors → check `AllowedOrigins` and domain/https
- Cloudflare cache: purge if stale assets

---

See `/docs/COPILOT_TASKS.md` Tasks 10–12 for broader CD/DNS/CORS guidance.
