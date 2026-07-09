# Beta Launch Ops Checklist

**Status:** Live in production — this checklist now tracks post-launch fixes and gaps, not launch blockers
**Last Updated:** 9 July 2026
**Owner:** DevOps / Infrastructure

---

## 🔴 Blocker: Run 6 Migrations Against Production

Everything below this line is **code-complete, typechecked, linted, and build-verified** (9 Jul 2026), but none of it is live until these run in the Supabase SQL Editor, in this order:

1. `supabase/fix-company-profile-creation.sql` — company signup could dead-end at "Profile Not Found" (missing INSERT policy + signup trigger never created the row)
2. `supabase/fix-applications-pipeline.sql` — adds the `documents` column the fixed apply flow needs
3. `supabase/fix-company-jobs-rls.sql` — companies had no SELECT/UPDATE policy on their own `jobs` rows
4. `supabase/add-job-analytics.sql` — job view + application drop-off tracking
5. `supabase/add-company-events-training.sql` — company-created events & training
6. `supabase/add-messaging.sql` — candidate ↔ company messaging

All six are idempotent (`IF NOT EXISTS` / safe re-run). `supabase/schema.sql` has been updated to match, so a fresh environment provisioned from it doesn't need any of these on top.

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
