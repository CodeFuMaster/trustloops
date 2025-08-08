# Copilot Agent – Project Tasks & Prompts (TestimonialHub)

> **Purpose**: A single, authoritative task list and set of prompts for GitHub Copilot Agent to finalize **TestimonialHub**, add AI v1 features, and ship a clean local→staging→production workflow on **trustloops.app**.
>
> **Usage TL;DR**: In your Copilot chat, paste the **Master Context** below, then say: **“Read /docs/COPILOT\_TASKS.md and wait for my task number. Only execute the task I specify. Always propose a plan first, then implement, open a PR, and stop.”**

---

## Master Context (paste in Copilot at the start of a session)

You are contributing to **TrustLoops / TestimonialHub**.

**Stack**: ASP.NET Core 8 (Minimal APIs) • React 18 + TypeScript + Vite • Supabase (Auth + Postgres + Storage) • LemonSqueezy (billing) • Fly.io (API) • Cloudflare Pages (web) • Domain: **trustloops.app**.

**Monorepo Layout**

```
apps/
  web/                  # React frontend (Vite)
src/
  WebApp/               # ASP.NET Core API
  Infrastructure/       # Supabase, storage, email, billing, background workers
  Shared/               # Shared models/DTOs
docs/                   # Documentation
supabase/               # SQL migrations, config
.github/                # CI/CD
```

**Definition of Done (DoD)**

* End-to-end flow works locally: create project → record/upload video testimonial (progress + retry) → approve → embed wall renders.
* Widget auto-resizes, supports tag/rating filters.
* AI v1 enrichment works on a testimonial (transcript, summary, sentiment, tags, captions/WebVTT), gated to **Pro** plan.
* Minimal analytics: submissions, approvals, embed views.
* CI: build + tests + basic e2e.
* CD: staging + prod deploys (Fly.io API, Cloudflare Pages web). CORS, Supabase Auth redirects, DNS on **trustloops.app**.
* Small PRs, typed code, updated docs, migration scripts included.

**Work Protocol**

1. Read **/docs/COPILOT\_TASKS.md**.
2. Wait for me to assign a **TASK #**.
3. For the chosen task: **propose a plan** (files to touch, steps, risks), then **implement**, create a **PR**, and **stop**. Do **not** continue to the next task until I say so.
4. Each PR must include: changes summary, test coverage, migration notes, updated docs.

---

## Environment & Secrets (reference)

**Frontend (.env.local)**

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_URL=http://localhost:5000   # staging/prod will override
```

**Backend (appsettings.Development.json)**

```
{
  "Supabase": {
    "Url": "",
    "ServiceKey": "",
    "JwtSecret": ""
  },
  "AllowedOrigins": [
    "http://localhost:5173",
    "https://staging.trustloops.app",
    "https://trustloops.app"
  ],
  "LemonSqueezy": {
    "WebhookSecret": ""
  }
}
```

**GitHub Actions → Secrets**

* FLY\_API\_TOKEN
* CLOUDFLARE\_API\_TOKEN, CLOUDFLARE\_ACCOUNT\_ID, CLOUDFLARE\_PROJECT\_NAME
* SUPABASE\_URL, SUPABASE\_SERVICE\_KEY, SUPABASE\_ANON\_KEY
* JWT\_SECRET
* LEMONSQUEEZY\_WEBHOOK\_SECRET
* (Optional AI provider keys; keep provider-agnostic with local stubs)

---

## Commands You Can Use to Drive Copilot

* **Initialization**: “Read **/docs/COPILOT\_TASKS.md** and wait for my instruction.”
* **Sequential tasking**: “Execute **TASK 1** only. Propose a plan first. After opening a PR, stop.”
* **Clarifications**: “List all files you intend to change and why before coding.”
* **Guardrails**: “Keep the PR under 300 LOC changed where possible; otherwise split.”
* **Review**: “Summarize the diff and test coverage. Point me to docs and migration steps.”
* **Proceed**: “Looks good. Execute **TASK 2** next.”

---

# Tasks (execute sequentially unless I say otherwise)

> Each task includes: **Goal**, **Acceptance Criteria**, **Likely Files**, **Implementation Steps** (that Copilot should follow), and a **Commit/PR title** suggestion.

## TASK 1 — Recorder polish: progress, retry, mobile

**Goal**: Reliable video upload UX.

**Acceptance Criteria**

* Visible upload **progress bar**; cancel + **retry** path on failure.
* Mobile-friendly constraints (prefer 720p fallback), clear permission errors.
* On submit: controls disabled; toast on success/error; optimistic UI handled.
* Unit test for upload hook; Playwright e2e: record → preview → submit → success.

**Likely Files**

* `apps/web/src/pages/RecordTestimonial.tsx` (was `features/testimonials/VideoRecorder.tsx`)
* `apps/web/src/lib/upload.ts` (or create)
* Toast/notification components
* Playwright config/specs

**Implementation Steps**

1. Abstract upload into a hook (`useVideoUpload`) that reports progress and supports retry.
2. Add progress UI and disabled states; handle iOS/Android constraints.
3. Improve error surfaces (permission denied, network error) via toasts.
4. Tests: unit for hook; e2e happy path.

**PR Title**: `feat(recorder): add upload progress, retry, mobile constraints`

---

## TASK 2 — Widget & wall filters + embed generator

**Goal**: Powerful, small, embeddable widget with filters.

**Acceptance Criteria**

* Wall supports `?tags=a,b&minRating=4` filters.
* Widget reads `data-project`, `data-tags`, `data-min-rating` attributes.
* Auto-resize via `postMessage` + `ResizeObserver`.
* `/embed/{slug}` preview page with copy-to-clipboard code.

**Likely Files**

* `apps/web/src/features/testimonials/EmbedWall.tsx`
* `apps/web/src/widget.ts`
* `apps/web/vite.widget.config.ts`
* API wall endpoint & DTO

**Implementation Steps**

1. Extend wall API + component to accept filters; update types.
2. Extend widget init to parse data-attrs; postMessage auto-resize.
3. Add `/embed/{slug}` preview + code generator.
4. Size budget: try <5kb gzipped for widget.

**PR Title**: `feat(widget): tag/rating filters + auto-resize + embed generator`

---

## TASK 3 — AI v1 enrichment (transcript, summary, sentiment, tags, captions)

**Goal**: Add clear, useful AI that improves quality and searchability.

**Acceptance Criteria**

* Supabase migration adds columns to `testimonials`: `transcript TEXT`, `summary TEXT`, `sentiment TEXT`, `tags TEXT[]`, `captions_url TEXT`.
* `POST /api/testimonials/{id}/ai/process` returns 202 + job id; background worker enriches and saves.
* Dashboard shows sentiment badge + tag chips; “Run AI” action per testimonial.
* Embed video loads `<track kind="captions" src=...>` when available.

**Likely Files**

* `supabase/migrations/XXXX_ai_enrichment.sql`
* `src/Infrastructure/Services/*` (interfaces: `IAudioTranscriber`, `IAiNlp` + LocalStub)
* `src/WebApp/*` (endpoint, job queue table, BackgroundService)
* `apps/web/src/features/testimonials/*` (UI for run AI + display)

**Implementation Steps**

1. Create migration + model changes.
2. Add queue table `ai_jobs`; implement `AiEnrichmentWorker` with stub providers.
3. Endpoint to enqueue; service to update record with transcript/summary/sentiment/tags; generate WebVTT and upload to Storage.
4. Frontend: “Run AI” button + status; show chips/captions.

**PR Title**: `feat(ai): transcript, captions, summary, sentiment, tags + background worker`

---

## TASK 4 — Gate AI to Pro plan (billing)

**Goal**: Ensure AI is a paid feature.

**Acceptance Criteria**

* LemonSqueezy webhook ingests subscription state.
* `POST /api/testimonials/{id}/ai/process` denies free users with 402 + upgrade CTA.
* Frontend shows upgrade prompt on 402.

**Likely Files**

* `src/WebApp/Endpoints/Billing/*` or similar
* `src/Infrastructure/Billing/*`
* Frontend: billing state, gating in UI

**Implementation Steps**

1. Add subscription cache table; webhook updates it.
2. API guard on AI endpoint.
3. UI: intercept 402 → show upgrade modal/CTA.

**PR Title**: `feat(billing): gate AI enrichment to pro plan via lemonsqueezy`

---

## TASK 5 — Minimal analytics (submissions, approvals, embed views)

**Goal**: Baseline product KPIs.

**Acceptance Criteria**

* API counters for `submissions_total`, `approved_total`, `embed_views_total`.
* Wall/Widget increments views via lightweight pixel/endpoint.
* Dashboard Analytics tab shows KPIs + last-30-days chart (placeholder if empty).

**Likely Files**

* API endpoint(s) + storage
* Frontend dashboard: new `Analytics` tab

**Implementation Steps**

1. DB fields or table for daily aggregates.
2. Increment on events (submit, approve, view).
3. Simple chart component.

**PR Title**: `feat(analytics): project KPIs + embed views counter`

---

## TASK 6 — Local dev scripts & docs

**Goal**: One-command local startup and clean docs.

**Acceptance Criteria**

* `scripts/local-dev.ps1` (and/or `.sh`) starts Supabase (if used locally), API at `:5000`, web at `:5173`.
* `.env.local.example`, `appsettings.Development.json.example` updated with all keys.
* `/docs/SETUP_GUIDE.md` updated; troubleshooting section added.

**Likely Files**

* `scripts/local-dev.ps1|sh`
* `apps/web/.env.local.example`
* `src/WebApp/appsettings.Development.json.example`
* `docs/SETUP_GUIDE.md`

**PR Title**: `chore(devex): local scripts + env examples + setup guide`

---

## TASK 7 — Tests baseline (API + web + e2e)

**Goal**: Minimum safety net.

**Acceptance Criteria**

* API integration tests: create testimonial, wall filters.
* Frontend unit tests (vitest) for upload hook + widget init parser.
* Playwright e2e: record → approve → embed render.
* `npm run test:e2e` in CI.

**Likely Files**

* `tests/` or within respective projects
* GitHub workflow uses caches and runs e2e

**PR Title**: `test: api + web unit + playwright e2e baseline`

---

## TASK 8 — Repo hygiene (PR/Issue templates, commit style)

**Goal**: Sustainable collaboration.

**Acceptance Criteria**

* `.github/pull_request_template.md` (Scope, Changes, Tests, Screenshots, Checklist).
* Issue templates for feature/bug.
* Conventional commit check (soft) in CI.

**Likely Files**

* `.github/ISSUE_TEMPLATE/*.yml`
* `.github/pull_request_template.md`
* Commit-lint step in CI (optional, soft).

**PR Title**: `chore(repo): PR/issue templates + conventional commit check`

---

## TASK 9 — CI (build + test)

**Goal**: Fast feedback.

**Acceptance Criteria**

* `.github/workflows/ci.yml` builds API & web, runs unit/integration/e2e.
* Caches node\_modules and NuGet.

**Likely Files**

* `.github/workflows/ci.yml`

**PR Title**: `ci: build + test (api, web, e2e)`

---

## TASK 10 — CD: API to Fly.io

**Goal**: Reproducible API deploys (main & staging).

**Acceptance Criteria**

* `fly.toml` for `trustloops-api` and `trustloops-api-staging` or parameterized.
* GitHub workflow `.github/workflows/deploy-api.yml` deploys on push to `main`/`staging`.
* Secrets set; post-deploy `/health` check.

**Likely Files**

* `src/WebApp/fly.toml`
* `.github/workflows/deploy-api.yml`

**PR Title**: `ci(cd): deploy api to fly.io with health checks`

---

## TASK 11 — CD: Web to Cloudflare Pages

**Goal**: Reproducible web deploys (main & staging).

**Acceptance Criteria**

* GitHub → Cloudflare Pages integration or workflow in `.github/workflows/deploy-web.yml`.
* Env vars for `VITE_API_URL` set per env.
* Successful staging deploy to `staging.trustloops.app`; production to `trustloops.app`.

**Likely Files**

* `.github/workflows/deploy-web.yml` (if not using native Pages integration)

**PR Title**: `ci(cd): deploy web to cloudflare pages with envs`

---

## TASK 12 — DNS, CORS, Supabase Auth redirects

**Goal**: Production domain works without CORS/auth pain.

**Acceptance Criteria**

* DNS: root + www → Pages; `api` → Fly.
* CORS allowed origins include staging + prod.
* Supabase Auth redirect URLs include both domains.
* Smoke test: login, record, approve, embed on prod domain.

**Likely Files**

* DNS config (manual steps documented in `/docs/DEPLOY_CHECKLIST.md`)
* Backend CORS settings
* Supabase project settings

**PR Title**: `docs(ops): deploy checklist + dns/cors/auth config`

---

## TASK 13 — Staging smoke tests & promotion

**Goal**: Confident releases.

**Acceptance Criteria**

* Script or README for staging checks: 7-step flow (create project → record → approve → wall → widget → AI → analytics).
* “Promote to prod” checklist.

**Likely Files**

* `/docs/RELEASE_CHECKLIST.md`
* `/docs/SMOKE_TESTS.md`

**PR Title**: `docs(release): staging smoke tests + promotion checklist`

---

# After Each Task – What Copilot Must Output

* **Plan**: files, steps, risks.
* **Diff Summary**: key changes by file.
* **Tests**: how to run and results.
* **Migrations**: commands to apply Supabase migrations if any.
* **Docs**: links to updated docs.
* **PR**: URL or PR number; title using the suggested format.

---

# Rollback & Recovery

* If a task grows too large, split into smaller PRs and stop after the first PR.
* If a deploy fails, Copilot should summarize logs and propose a revert or hotfix branch.
* Keep feature flags for risky toggles where sensible (e.g., AI enrichment UI).

---

# Example Copilot Driving Script (you say this in chat)

1. **Initialize**

   * “Paste master context → Read /docs/COPILOT\_TASKS.md → Wait for my task number.”
2. **Run TASK 1**

   * “Execute TASK 1 only. Propose a plan first. After opening a PR, stop.”
3. **Review**

   * “Show me the diff summary, tests, and how to run locally.”
4. **Approve & Continue**

   * “Looks good. Execute TASK 2 next with the same protocol.”

Repeat until TASK 13 is complete.

---

*End of /docs/COPILOT\_TASKS.md*
