# Beta Launch Ops Checklist

**Status:** Live in production — this checklist now tracks post-launch fixes and gaps, not launch blockers
**Last Updated:** 10 July 2026
**Owner:** DevOps / Infrastructure

---

## 🔴 Blocker: Run 9 Migrations Against Production

Everything below this line is **code-complete, typechecked, linted, and build-verified**, but none of it is live until these run in the Supabase SQL Editor, in this order:

1. `supabase/fix-company-profile-creation.sql` — company signup could dead-end at "Profile Not Found" (missing INSERT policy + signup trigger never created the row)
2. `supabase/fix-applications-pipeline.sql` — adds the `documents` column the fixed apply flow needs
3. `supabase/fix-company-jobs-rls.sql` — companies had no SELECT/UPDATE policy on their own `jobs` rows
4. `supabase/add-job-analytics.sql` — job view + application drop-off tracking
5. `supabase/add-company-events-training.sql` — company-created events & training
6. `supabase/add-messaging.sql` — candidate ↔ company messaging
7. `supabase/add-auto-apply.sql` — candidate auto-apply preferences + match queue (10 Jul 2026)
8. `supabase/add-informal-jobs.sql` — SA jobs first, informal work experience, `jobs.duration` (20 Jul 2026)
9. `supabase/fix-application-visibility.sql` — issue #4: candidates could not see the jobs they applied for, could apply to the same job repeatedly, and companies could not see or action applications on their own jobs (22 Jul 2026)

`supabase/fix-application-visibility.sql` is idempotent and safe to re-run. The
earlier files use bare `CREATE POLICY`, so re-running one of those throws 42710
on the policy statements even though the table and column changes are guarded.
Run each of 1 to 8 once, in order.

`supabase/schema.sql` has been updated to match, so a fresh environment provisioned from it doesn't need any of these on top.

### After migration 9, set these in the Netlify dashboard

`RESEND_API_KEY` and `EMAIL_FROM` (see `.env.example`). They turn on the
confirmation email an applicant gets after applying. The apply flow works
without them, applicants simply get no email, so this is not a deploy blocker.

---

## 🟢 10 July 2026 — Bug Fixes & New Feature

**Bugs fixed (no migration needed, pure app-code):**
- Company profile "details wouldn't save" / "keeps saying enter url and doesn't continue" — same root cause: the Website and Logo URL fields used `type="url"`, and a scheme-less value (e.g. `linkedin.com/company/x` instead of `https://linkedin.com/company/x`) triggers the browser's native validation, which silently blocks the whole form's `onSubmit` before any of our code runs. Same bug existed in the admin Learnerships and Late-Uni-Apps "Apply Link" fields. Fixed by switching all four to `type="text"` + a `normalizeUrl()` helper (`lib/normalizeUrl.ts`) that auto-prepends `https://` on save instead of blocking the form.
- Profile editor not centered on wider-than-mobile screens — both `/candidate/profile` and `/company/profile` had a `max-w-*` wrapper with no `mx-auto`, so the form sat flush against the sidebar instead of centering in the remaining space. Fixed on both.

**New feature — Candidate Auto-Apply** (`/candidate/auto-apply`):
- Free opt-in for now (no billing — `company_profiles.subscription_tier` pattern exists but Stripe still isn't built; this uses a simple `enabled` flag that a real paywall can gate later without reworking the feature)
- Candidate sets: fields/expertise, work type(s), preferred locations, excluded companies — pre-filled from their profile skills on first setup
- **Review queue, not fully autonomous**: a daily server-side matcher (`scripts/run-auto-apply-matcher.ts`, added as a step in the existing `daily-scraper.yml` cron) finds newly-qualifying jobs and stages them in `application_matches`. Nothing reaches the `applications` table until the candidate clicks "Apply" on a specific match — same insert path as the manual apply flow, reusing their saved profile + CV/documents.

---

## What Was Fixed This Session

### 1. Job Applications Never Reached the Database

`ApplyForm.tsx` (the public "apply for a job" form) submitted to Netlify Forms only. Nothing wrote to the Supabase `applications` table, so `/company/applications`, `/company/dashboard`, `/company/jobs` (app counts), and `/candidate/applications` were always reading an empty table for real users.

**Fixed:** `ApplyForm.tsx` now inserts into `applications` for real (DB-backed) jobs, with the Netlify Forms submission kept as a best-effort duplicate. Static fallback job listings (no `jobs` row to satisfy the FK) still go through Netlify Forms only, as before.

### 2. Company Signup Could Dead-End at "Profile Not Found"

`company_profiles` had RLS policies for SELECT/UPDATE but no INSERT policy, and the signup trigger never created the row. Every company-portal page redirects to `/company/profile` when the row is missing, and that page could only UPDATE an existing row — a dead end.

**Fixed:** `/company/profile` now upserts instead of requiring an existing row; the signup trigger provisions the row; RLS gained the missing INSERT policy.

### 3. Companies Couldn't Reliably Manage Their Own Jobs (found during this work)

`jobs` had a public SELECT policy scoped to `status = 'active'` only, an open INSERT policy, and an admin-only ALL policy — but nothing letting the owning company SELECT or UPDATE their own row regardless of status. Effects: closed/draft jobs didn't appear in `/company/jobs`, and both the Close/Reopen button and the Edit Job form silently saved nothing (RLS-filtered zero-row updates don't error).

**Fixed:** added company-scoped SELECT/UPDATE policies; `JobActions.tsx` now surfaces an error if an update ever fails instead of assuming success.

### 4–6. The Three Named Company-Portal Gaps — Built

| Feature | What shipped |
|---|---|
| Job view / application drop-off analytics | `job_views` + `application_starts` tables, logged from the job detail and apply pages; a views→started→submitted funnel on `/company/dashboard`; per-job columns on `/company/jobs` |
| Company-created events & training | `/company/events` and `/company/training` (list/new/edit) submit as `vetted_status='pending'`; reviewed via `/admin/trainings` (extended) and new `/admin/events` (didn't exist before — events were previously scraper-only) |
| Candidate ↔ company messaging | One thread per company↔candidate pair, shared inbox UI (`components/messaging/MessagesInbox.tsx`) on `/company/messages` and `/candidate/messages`, entry points from candidate search and the applications list |

Job posting itself (`/company/jobs`, `/company/jobs/new`) and application review (`/company/applications`) already worked before this session, aside from bug #3 above.

---

## ✅ Already Resolved Since Original Launch Checklist

The original version of this document listed setup blockers for going live. The platform has been live since the original March 2026 launch; those steps are done. Also resolved since then, ahead of the original "Important/Nice to Have" lists below:

- Password reset flow (`/forgot-password`, `/reset-password`) — implemented
- Error boundaries for public/candidate/company/admin sections — implemented
- Loading skeletons on most dashboard/list routes — implemented
- Mobile sidebar navigation (candidate/company/admin) — implemented, hamburger drawer on all three
- Company job editing — implemented (`/company/jobs/[id]/edit`)
- Candidate multi-document library (CV, certificates, cover/motivational letters) — implemented, beyond original single-CV-upload scope
- AI-powered CV audit (Claude) — implemented at `/candidate/cv-audit`, not originally scoped
- Daily job/event auto-refresh (GitHub Actions scraper: RemoteOK, Remotive, Adzuna, Eventbrite → Supabase) — implemented, not originally scoped — this substantially covers the "Data Freshness System" roadmap item for jobs/events (learnerships/late-uni deadlines are still hand-curated)

---

## 🟡 Still Outstanding (Important, Not Blocking)

### 1. Email Notifications (1–2 days)
- Integrate Resend or SendGrid
- Trigger emails on application status changes and new messages via Supabase Edge Functions
- No provider is wired up yet — checked `package.json` and repo-wide, nothing found

### 2. Google OAuth (1 day)
- Configure in Supabase → **Authentication** → **Providers** → **Google**
- Reduces signup friction

### 3. OG Social Card
- Current logo is wide-format; renders poorly on WhatsApp/Twitter/LinkedIn
- Requires a square or 1200×630 image — design task

### 4. Move Static Jobs to Supabase
- With the daily scraper now populating real jobs, check whether the static fallback in `data/constants.ts` is still needed as a safety net or can be removed

---

## 📋 Post-Launch (Q4 2026+)

- Stripe billing integration (`company_profiles.subscription_tier`/`subscription_status` columns exist but are unused — no billing logic reads/writes them yet)
- AI matching with pgvector (builds on the existing Claude CV-audit integration)
- Skill assessments
- Analytics dashboards beyond the new views/drop-off funnel (time-to-hire, skill gap analysis, exports)
- Mobile app

---

## Summary

**Platform is live.** Current priority order:
1. 🔴 Run the 6 migrations listed above against production — nothing shipped this session is live until then
2. 🟡 End-to-end smoke test each: apply for a job as a candidate and confirm it appears in `/company/applications`; sign up as a new company and confirm the dashboard loads without redirect looping; close/reopen and edit a job; post a training/event as a company and approve it as admin; message a candidate from search and reply as that candidate
3. 🟡 Email notifications, Google OAuth, and the smaller items above as capacity allows
