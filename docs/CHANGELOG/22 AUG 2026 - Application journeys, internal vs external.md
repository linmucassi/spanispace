# 22 Aug 2026 (2)

## Add: application journeys — internal vs external, unified admin/company visibility

Linda's request: candidates need consistent journeys applying for jobs, learnerships, and university applications. Admins must see every application everywhere with metrics/status; companies must see only applications on their own jobs, with metrics/status and the ability to act on them and message applicants. Two application types: **external** (scraper-sourced, not posted by Spanispace or any company — admin sees applicants, candidate is redirected to the real external link) and **internal** (company/Spanispace-posted — company can choose full on-platform apply or redirect to their own careers page, but admin must always see the full flow either way).

Researched the actual state first rather than assuming a gap this size was half-built already — it wasn't:
- `jobs.apply_link` was stored but never read by the candidate-facing flow. Every job, scraped or not, funneled through the same internal apply form — a live bug where a candidate applying to a RemoteOK-scraped job was submitting into Spanispace's own `applications` table, which the real employer would never see.
- The standalone `learnerships` table (admin-curated) was never shown to candidates anywhere — dead code. What candidates actually saw as "Learnership" were `jobs` rows with `job_type = 'Learnership'`.
- `late_uni_apps` (Colleges/Universities) had zero application tracking — just a card with a plain external link.
- Scraped jobs were auto-verified (`vetted_status: 'verified'`, hardcoded) with no admin review, and owned by a shared `company_profiles` row named "Spanispace Curated" — meaning whoever had login access to that one company account could see applicant data for every scraped job, across every source.

Went through plan mode given the size (touches the DB schema, the scraper, 4 job-posting forms, the public apply flow, both admin and company dashboards, and adds a whole new university-interest feature). Confirmed scope with Linda first via AskUserQuestion: merge the standalone `learnerships` table into `jobs` but keep Colleges/Universities fully separate; redirect-mode listings capture a lightweight application record before sending the candidate out, not just a click count; university interest gets its own small table, not folded into `applications`; fix the scraper ownership/auto-verify bug now rather than as a follow-up.

**Data model** (`supabase/add-application-journeys.sql`, mirrored into `supabase/schema.sql` — **not yet run against production**, see below):
- `jobs.origin` (`company` / `admin_curated` / `scraped`) — who owns/posted it, drives dashboard visibility. Named `origin` rather than reusing `source` to avoid colliding with the existing `Job.source: 'db' | 'static'` TS field, which means something unrelated (DB row vs. static fallback data).
- `jobs.apply_mode` (`on_platform` / `redirect`) — how the candidate finishes. Scraped jobs are always `redirect`; company/admin jobs choose either.
- Backfill: existing rows owned by the shared "Spanispace Curated" company get `origin = 'scraped'`, `apply_mode = 'redirect'`, `company_id = NULL` — this is the ownership-bug fix applied retroactively, not just for new scrapes.
- New `university_application_interests` table (candidate, institution, contact details, timestamp) — fully separate from jobs/applications, admin + the candidate's own rows only, no company access.
- No new column on `applications` itself — a "was this a redirect capture" distinction is derived by joining to `jobs.apply_mode` at display time. `applications` already had two RLS-recursion incidents (`fix-candidate-profile-visibility-recursion.sql`, `fix-rls-recursion.sql`); not worth the risk of touching its schema for this.
- The old standalone `learnerships` table is left in place, untouched, no longer written to — not dropped, no data-loss risk.

**Scraper** (`lib/scrapers/db-writer.ts`): removed `getCuratedCompanyId()` entirely. New scraped rows get `company_id: null`, `origin: 'scraped'`, `apply_mode: 'redirect'`, `vetted_status: 'pending'` (was hardcoded `'verified'`). Added `origin`/`apply_mode` to the same schema-fallback retry ladder the file already uses for `duration`, so a scrape run before the migration lands doesn't hard-fail.

**Learnerships merged into `jobs`**: `app/admin/learnerships/new/page.tsx` now inserts into `jobs` (`job_type: 'Learnership'`, `origin: 'admin_curated'`) instead of the orphaned `learnerships` table — added a required Description field to satisfy `jobs.description NOT NULL` (the old table had none), `stipend` maps to `salary_range`. `app/admin/learnerships/page.tsx` now lists `jobs` filtered to `job_type = 'Learnership'`, reusing the same approve/reject/delete actions as `/admin/jobs`. Learnerships candidates see on `/jobs` and ones admin curates are now the same underlying rows.

**Candidate apply flow**: `ApplyForm.tsx` and `JobDetailView.tsx` take the job's `applyMode`/`applyLink` (added to `lib/publicJobs.ts`'s mapping and `types.ts`'s `Job` type). `on_platform` mode is pixel-identical to before. `redirect` mode: same form (already only requires `fullName`/`phone`, which is exactly what a redirect capture needs — no changes to `/api/applications/route.ts` at all), different copy ("Continue to application"), and on success it opens the real `apply_link` in a new tab plus shows a visible fallback link in case the popup was blocked.

**Company & admin job posting forms** (`app/company/jobs/new`, its `[id]/edit`, `app/admin/jobs/new`, `app/admin/learnerships/new`): added an apply-mode radio ("Accept applications on Spanispace" vs. "Send applicants to our own careers page"), with a required `apply_link` field (via the existing `lib/normalizeUrl.ts` pattern) when redirect is chosen.

**Dashboards**:
- `app/admin/applications/page.tsx`: origin filter (All / Company / Admin-curated / Scraped), badges for Learnership / Scraped / Redirected per row.
- `app/company/applications/ApplicationList.tsx`: a "Redirected" badge and an explanatory note when a candidate was sent to the company's own careers page after leaving details on Spanispace.
- `app/admin/jobs/page.tsx`: Source column + filter, and a bulk "Approve selected" action (reuses the existing bulk-select state already used for expiry extension) — needed because scraped jobs now land in `pending` instead of auto-publishing, and the scraper has produced 70+ jobs in a single run before.
- `app/admin/dashboard/page.tsx`: "University Interest (7d)" stat card, and a "N scraped jobs waiting for review" callout linking to `/admin/jobs?origin=scraped` (read via a plain `window.location.search` check in a `useEffect`, not `next/navigation`'s `useSearchParams`, to avoid forcing that whole client page into a Suspense boundary for one deep link). "Learnerships" stat now counts `jobs` where `job_type = 'Learnership'` instead of the old table.

**University application interest** (new, fully separate per Linda's instruction): `POST /api/university-interest`, modeled directly on `/api/applications/route.ts`'s conventions (rate limiting, control-character stripping, candidate-profile resolution). `components/AcademicPortal.tsx`'s plain "Apply" link (for DB-backed institutions only — `late_uni_apps.id` is now threaded through `lib/publicAcademic.ts`; static fallback entries have no `id` and keep the old plain-link behavior) now opens a small modal that captures name/phone/email (pre-filled from the candidate's profile if signed in), then opens the institution's real link the same way redirect-mode jobs do. New read-only `app/admin/university-applications/page.tsx` (added to `AdminSidebar.tsx`) — no status pipeline, since there's nothing to action, just visibility.

**Verified**: `npx tsc --noEmit` clean, `npm run build` clean (confirmed new routes `/admin/university-applications` and `/api/university-interest` in the route table). Smoke-tested against the live dev server (migration not yet run in production, so this also exercises the schema-fallback retry paths): `/jobs`, `/university`, a real job detail page, and its `/apply` page all returned 200 with no error markers.

**Still outstanding, not fixed here:** `supabase/add-application-journeys.sql` needs to be run in the Supabase SQL Editor against production — same handoff as the signup-trigger fix earlier today. Until then, `jobs.origin`/`apply_mode` and the whole university-interest table don't exist live; every write path degrades gracefully (falls back to the old columns/behavior) but none of the new redirect/visibility features are actually active.

## Files changed
```
A  app/admin/university-applications/page.tsx
A  app/api/university-interest/route.ts
A  supabase/add-application-journeys.sql
M  app/(public)/jobs/[id]/JobDetailView.tsx
M  app/(public)/jobs/[id]/apply/ApplyForm.tsx
M  app/(public)/jobs/[id]/apply/page.tsx
M  app/admin/applications/page.tsx
M  app/admin/dashboard/page.tsx
M  app/admin/jobs/new/page.tsx
M  app/admin/jobs/page.tsx
M  app/admin/learnerships/new/page.tsx
M  app/admin/learnerships/page.tsx
M  app/company/applications/ApplicationList.tsx
M  app/company/applications/page.tsx
M  app/company/jobs/[id]/edit/page.tsx
M  app/company/jobs/new/page.tsx
M  components/AcademicPortal.tsx
M  components/admin/AdminSidebar.tsx
M  lib/publicAcademic.ts
M  lib/publicJobs.ts
M  lib/scrapers/db-writer.ts
M  supabase/schema.sql
M  types.ts
M  types/database.ts
```
