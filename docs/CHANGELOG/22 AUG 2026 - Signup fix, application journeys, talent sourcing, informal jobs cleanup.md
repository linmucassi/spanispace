# 22 Aug 2026

## Fix (needs production SQL run): every candidate signup fails with "Database error saving new user"

Report from Linda: "Almost anyone I try to tell to get on the sight via Google email it does this... 'Database error saving new user.'"

Reproduced directly against the live database (`rssuacaedvihhpcakuvm`) using the service-role admin API with throwaway test accounts, rather than guessing from the SQL files — this repo's `supabase/*.sql` migrations are run manually in the Supabase SQL Editor, so what's actually live can drift from what's in git:

- `supabase.auth.admin.createUser()` with `role: 'company'` metadata → succeeds.
- The same call with `role: 'candidate'`, or with no `role` at all → fails every time, 100%, even with a fully-formed name/phone/location matching exactly what the register form or Google sign-in would send.

Google sign-in (`lib/auth/useGoogleSignIn.ts`, `signInWithIdToken`) never sets a `role` in user metadata at all, so it always takes the candidate branch — which is why this looked Google-specific to Linda. It isn't: the email/password candidate tab on `/register` sends `role: 'candidate'` explicitly and hits the identical bug. Company signups were untouched by luck of table structure, not because anything company-specific was fixed.

**Root cause:** `supabase/schema.sql`'s `handle_new_user()` trigger function was edited on 13 Aug 2026 (commit `dde2dbc`) and lost the `SET search_path = public` clause that `supabase/fix-security-hardening.sql` (8 Aug 2026) had added — along with that same migration's signup-role allowlist (reopening the admin-role-escalation hole tracked as issue #8, a separate but related regression). `handle_new_user()` is `SECURITY DEFINER`, invoked by Supabase's `supabase_auth_admin` role, whose own `search_path` deliberately excludes `public` (a Supabase hardening default, to stop search_path-hijacking attacks). Company signups insert only into `company_profiles`, which has no trigger of its own, so the missing search_path was invisible there. Candidate signups insert into `candidate_profiles`, which fires the `compute_profile_score()` `BEFORE INSERT` trigger (`supabase/fix-cv-completeness.sql`) — and that function does an unqualified `SELECT ... FROM candidate_documents`, which fails to resolve without `public` on the path, throwing an error that aborts the whole `auth.users` insert transaction. That's the exact and only difference between the two paths; isolated by testing a direct `candidate_profiles` insert via the service-role client (which has a normal search_path) — that succeeded and computed the score correctly, proving `compute_profile_score()` itself is fine and the bug is specifically the missing search_path on the trigger that invokes it.

**Fixed:**
- `supabase/schema.sql` — restored both the `SET search_path = public` clause and the `fix-security-hardening.sql` role allowlist (`safe_role`, only `'company'` passes through, everything else including `'admin'` collapses to `'candidate'`) on `handle_new_user()`, so a future full-schema run doesn't reintroduce either regression.
- New `supabase/fix-candidate-signup-search-path.sql` — the corrected function definition, safe to run standalone and idempotent. **Still needs to be run in the Supabase SQL Editor against production** — not achievable from application code, this is a database trigger fix.

All diagnostic test accounts (both the ones that succeeded and the ones that failed) were created and deleted via the service-role admin API during investigation; nothing left behind in the live database.

**You still need to:** run `supabase/fix-candidate-signup-search-path.sql` in the Supabase SQL Editor. Until that happens, no one can create a candidate account on the live site by any signup path.

Also added the Röhlig-Grindrod YES Programme 2027 learnership (5 locations, Gauteng/Eastern Cape/Western Cape/Durban, merged into one listing since the schema has no multi-location support; expiry set to the earliest of the five closing dates, 26 Aug 2026, so candidates aren't misled about locations that close sooner).

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

## Add: Direct Talent Sourcing + Candidate Document Verification

Linda proposed two more candidate journeys on top of the application-journeys work shipped earlier today: companies searching and inviting candidates directly from a talent pool instead of only waiting for applications, and a guided document-verification flow producing a standing "Verified" badge.

Researched the existing infrastructure first rather than assuming a blank slate — there was real prior art that changed the scope:

- `app/company/candidates/CandidateSearch.tsx` already lets a company browse/filter candidates, but only ones who **already applied to one of their jobs** — enforced by RLS (`company_has_applicant()`, a deliberate S3 hardening pass in `fix-security-hardening.sql`, not an oversight). No invite mechanism existed anywhere; messaging was the only contact path.
- `candidate_profiles.verified BOOLEAN DEFAULT FALSE` already existed and was already displayed in 4 places (search cards, profile preview) — but **nothing anywhere ever set it to true**. A dead column, exactly waiting for this feature.
- `candidate_documents.doc_type` only allowed `cv`/`certificate`/`cover_letter`/`motivational_letter`/`other` — no ID/qualification/transcript type, and no verification status of any kind.

Confirmed scope with Linda via AskUserQuestion before planning: talent-pool visibility is **opt-in** (a candidate-controlled toggle, independent of verification — not "verified candidates only" as the literal wording might suggest); document review is **admin-only** (companies never see raw ID/qualification documents, only the resulting badge); verification is a **profile-level standing badge**, verified once, not redone per application.

**Data model** (`supabase/add-talent-sourcing-and-verification.sql`, mirrored into `supabase/schema.sql` — **not yet run against production**):
- `candidate_profiles.open_to_offers BOOLEAN DEFAULT FALSE` — candidate opts in. New RLS policy `"Companies read opted-in candidates"` is **additive** to the existing applicant-only policy (Postgres OR's multiple permissive SELECT policies together) — a company still can't see anyone who hasn't either applied to one of their jobs or opted in.
- New `job_invites` table — a company inviting a candidate to apply for a specific job. Deliberately **not** folded into `applications`: an invite is a signal, not an application. Accepting one routes the candidate through that job's own `/jobs/[id]/apply` flow (respecting whatever `apply_mode` that job already has from this morning's work), so `applications` stays the single source of truth for the hiring pipeline — mirrors how `job_views`/`application_starts` are lightweight signal tables alongside `applications`, not part of it. RLS: a company can only invite someone it's already allowed to see (reuses `company_has_applicant()` in the `WITH CHECK`, so this can't become a second way to enumerate arbitrary candidates); candidate reads/responds to their own; admin full access.
- `candidate_documents.doc_type` extended with `id_document`/`qualification`/`transcript`; new nullable `verification_status`/`verification_note` columns, meaningful only for those three types (the app sets `'pending'` explicitly on upload; the existing five doc types stay `NULL` so nothing renders a stray badge on a CV). New admin blanket RLS policy on `candidate_documents` — it previously had only an owner-only policy plus a CV-only company policy, no admin access at all.
- `candidate_profiles.verified` gets no schema change — it's flipped by an explicit admin click, not a trigger, matching every other `vetted_status` workflow already in this app (jobs/trainings/events/learnerships are all deliberate admin actions, never auto-derived from counts).

**Candidate-facing:**
- `app/candidate/profile/page.tsx` — new "Talent Pool Visibility" toggle, saved with the same schema-fallback-retry pattern already used for `professional_summary` on this page.
- `components/candidate/DocumentLibrary.tsx` — three new doc types in the existing type-driven dropdown (no separate UI needed, it already renders from `DOC_LABELS`), a status pill (Pending review / Verified / Rejected, with the rejection note shown) next to those three types only.
- `app/candidate/dashboard/page.tsx` — a verification-status card and a pending-invites card, switched its profile query to `select('*')` for the same forward-compatibility reason used throughout this session.
- New `app/candidate/invites/page.tsx` + `InviteList.tsx` (added to `CandidateSidebar.tsx` nav) — Accept routes straight into the real job's apply flow; Decline just updates status.

**Company-facing:**
- `app/company/candidates/page.tsx` — **no query change needed** for the pool itself (already `select('*')` on `candidate_profiles`; the new additive RLS policy does the work), but now also fetches the company's own active jobs (for the invite picker), which of the visible candidates are actual applicants (badge-only, RLS already decided visibility), and invites already sent (so the UI doesn't offer to re-invite).
- `CandidateSearch.tsx` — "Applied to your jobs" vs "Open to offers" badge on every card and in the detail modal; an "Invite to apply" flow (job picker + optional message) in the modal, posts to `job_invites`.
- New `app/company/invites/page.tsx` (added to `CompanySidebar.tsx` nav) — sent invites and their status.

**Admin-facing:**
- New `app/admin/candidate-verification/page.tsx` (added to `AdminSidebar.tsx` nav) — candidates grouped by their submitted verification documents, expand to Approve/Reject each (rejection prompts for a note shown back to the candidate), and a "Mark Verified" / "Revoke Verified" action that flips `candidate_profiles.verified` directly.
- New `app/admin/invites/page.tsx` — read-only oversight (same pattern as the university-interest admin page from this morning's feature), nothing to action since companies/candidates own accept/decline and sending.
- `app/admin/dashboard/page.tsx` — "Pending Verifications" and "Open Invites" stat cards, same `StatsCard` pattern as every other count on that page.

**Verified:** `npx tsc --noEmit` and `npm run build` both clean (confirmed all 4 new routes in the build output: `/admin/candidate-verification`, `/admin/invites`, `/candidate/invites`, `/company/invites`). Smoke-tested against the live dev server (migration not yet run, so every new write path is exercising its schema-fallback-retry branch): public pages return 200, every new auth-gated route correctly redirects unauthenticated requests to login rather than erroring.

**Still outstanding, not fixed here:** `supabase/add-talent-sourcing-and-verification.sql` needs to be run in the Supabase SQL Editor against production — third migration handoff today. Until then, every new write path degrades gracefully (same pattern used throughout this session) but none of these features are actually active.

## Fix: removed 12 fabricated "informal job" listings from production

Linda asked whether the informal-work job listings on the public jobs board were real, suspecting they were dummy data from earlier development. She was right, and it was worse than the static fallback list she was likely looking at.

**Two separate places had this fake data:**

1. `data/constants.ts`'s `JOBS` array (the static fallback `lib/publicJobs.ts` serves only when Supabase has zero active/verified jobs) had 6 fabricated entries (ids 16-21: Harbour View Restaurant, Sunrise Superette, Mzansi Building Projects, Private household ×1, Fashion Corner, Kasi Flavours Kitchen) — obviously placeholder: fake company names, empty `applyLink`, hardcoded `expiryDate: '2026-12-31'`, all marked `VettedStatus.VERIFIED` despite never having been vetted.
2. **More seriously**: `supabase/add-informal-jobs.sql` (run against production 13 Aug 2026, per the roadmap's migration-verification pass) directly seeded **12 fabricated job listings** into the live `jobs` table — Harbour View Restaurant, Kasi Flavours Kitchen, Sunrise Superette, Mzansi Building Projects, Private household ×3, Shield Security Services, Fashion Corner, Sparkle Car Wash, QuickBite Deliveries, Community Spaza — all `vetted_status: 'verified'`, `status: 'active'`. These have been showing to real site visitors as genuine job listings for over a week.

Checked for real-world consequences before touching anything, since `applications.job_id` cascades on delete: **2 real applications existed against these fake jobs.** One was Linda's own test account. The other was a genuine candidate — SNOTHANDO DLULISA (0601980446, amandelasnothando@gmail.com, Cape Town) — who applied 14 Aug to the fake "Waiter (3 Month Contract)" listing believing it was real, with a CV and a real about-you write-up (customer service, sales operations, cash/POS, training/mentoring background).

Surfaced this to Linda before deleting anything (a real person's data was about to be destroyed, not just cleanup of placeholder content) and gave her SNOTHANDO's full contact details so she could follow up herself. She chose to delete everything rather than preserve the orphaned application record.

**Done:**
- Deleted all 12 seeded job rows from the live `jobs` table (cascaded both applications with them) via a one-off script using the service-role client, same pattern as every other one-off DB operation this session.
- Removed the same 6 fabricated entries from `data/constants.ts`'s `JOBS` fallback array.
- Stripped the seed block out of `supabase/add-informal-jobs.sql` entirely (kept the real schema changes: `job_type` widening for Piece Job/Temporary, `jobs.duration`, `candidate_profiles.professional_summary`, the `work_experiences` table, the `apply_link` index) — so a future run of this file against a fresh database can never reintroduce this. The `seed_history` table and its `'informal-jobs-2026-07'` marker row are left alone in production as a tombstone: the file no longer references that key at all, so there's nothing left that could re-seed against it, but removing the marker itself wasn't necessary and touching it added no value.

**Verified:** `npx tsc --noEmit` clean after the `constants.ts` edit.

**Still to do (not something I can do):** Linda should reach out to SNOTHANDO DLULISA directly, since Spanispace has no real waiter listing to redirect them to.

## Add: platform roles + general invites, company org/RBAC, interview scheduling + calendar

Linda asked three things at once: can an admin promote a general user to admin; are companies handled as multi-user organizations with roles; do we have a calendar for events/meetings/interviews. Researched all three before answering (not guessing): no admin-promotion UI or API existed anywhere; `company_profiles.user_id` is `UNIQUE` — a company was strictly one login, no membership table existed; the `events` table is a public content board like the jobs board, not a scheduler, and no interview/meeting/calendar feature or calendar UI library existed at all. Confirmed: "Yes, build all three."

This is the largest single feature of the day — three architecturally distinct subsystems. Went through plan mode and confirmed the real risk up front: `handle_new_user()` (the signup trigger) already caused a full production outage earlier today (the search_path regression). Locked in via AskUserQuestion before building: invites work for both existing and not-yet-registered users (admin→admin, company→team member, anyone→referral), company roles are a real 5-tier hierarchy (Owner/Admin/Manager/Member/Viewer) per Linda's own spec, platform roles split into Super Admin/Platform Admin, calendar means interview scheduling (company↔candidate, tied to an application) plus a calendar view, "meetings" = interviews, not a separate system.

**Critical design constraint, held throughout:** invite acceptance is never wired into `handle_new_user()`. It's an explicit `POST /api/invites/accept` call the client makes *after* `supabase.auth.signUp()` succeeds (or, for the confirmation-email path where no session exists yet, handled by `app/(auth)/callback/route.ts` on the same principle) — both share `lib/invites/acceptInvite.ts`, running server-side with the service-role client. The signup trigger itself is untouched by any of this.

**Caught and fixed before it shipped:** the first draft of `lock_user_role()` (the trigger that stops a non-super-admin from self-promoting) checked `is_super_admin()` unconditionally — but `auth.uid()` is `NULL` under a service-role connection (no JWT), so it would have silently reverted the invite-acceptance route's own attempt to grant admin. Fixed to only enforce the lock when there's an actual authenticated non-super-admin actor (`auth.uid() IS NOT NULL AND NOT is_super_admin()`), matching the same service-role trust model every other admin script in this session already relies on.

**Data model** (`supabase/add-roles-invites-and-calendar.sql`, mirrored into `schema.sql` — **not yet run against production**):
- **Platform roles:** `users.role` widened to include `super_admin`. `is_admin()` widened to accept both `admin` and `super_admin` — every existing "Admin full access X" policy in this app (dozens of them) keys off `is_admin()`, so super_admin inherits all of them automatically, zero other RLS changes needed. New `is_super_admin()` gates promoting/demoting admins and inviting new ones specifically — a regular Platform Admin can't mint more admins at will. **Linda needs to run one manual `UPDATE users SET role = 'super_admin' WHERE email = ...` for her own account** — bootstrapping the first super_admin can't happen through the app itself, same as how the first admin was always provisioned out of band.
- **General invites:** new `platform_invites` table (token, email, `invite_type` IN `platform_admin/company_member/referral`, status, expiry). No anon SELECT — an unauthenticated visitor can never enumerate invites; a new `/api/invites/preview` route returns only the minimum needed for the register page to show "You've been invited to join X as Y" context, looked up by the token itself.
- **Company org/RBAC:** new `company_members` table, one person per company in v1 (`UNIQUE(user_id)`), 5-tier role CHECK. Backfilled: every existing company got an `owner` membership row for its current `user_id` in the same migration, so nothing existing changes behavior. RLS is **additive only** — a new permissive policy per company-scoped table (jobs, trainings, events, applications, job_invites, messaging via `is_thread_party()`, company_profiles) layered *alongside* the original owner-only policies, never replacing them (Postgres ORs multiple permissive policies together — same pattern already used twice earlier today). Ownership transfer is explicitly out of scope for v1 — a trigger blocks editing/removing an `owner` row outright, not exposed in any UI.
- **Interviews:** new `interviews` table (application/company/candidate, proposed time, duration, location, notes, status). Company manages via `company_can_operate()`; candidate reads/responds to their own; admin full access.

**App-side, roughly in the order built:**
- Fixed two role-routing gaps that would otherwise have silently broken this feature: `lib/supabase/middleware.ts` gated `/admin/*` on `role === 'admin'` exactly (would have locked out real super_admins) and `/company/*` on `role === 'company'` exactly (would have locked out team members whose base role stays whatever it was, e.g. a candidate added as a company's recruiter). Both widened — admin route also accepts `super_admin`; company route falls back to a `company_members` lookup when the base role isn't `company`. Same fix applied to `lib/auth/roleRedirect.ts` and `app/(auth)/callback/route.ts` so post-login routing sends the right people to the right portal.
- `app/(auth)/register/page.tsx` reads `?invite=` from the URL (plain `window.location.search`, not `useSearchParams`, same Suspense-avoidance reasoning as earlier today), previews it via the new route, locks the signup to the candidate tab and hides the company tab when the invite means "join an existing company" or "become admin" (picking the company tab there would have created a second, unrelated company), shows context-appropriate banner copy, and routes based on what the invite actually granted rather than the tab.
- New `/admin/users` (super-admin-gated, promote/demote admin, invite-by-email with a copyable link since Resend isn't configured yet — same non-automated-email pattern as this app's existing "Sent Invites" pages).
- New `lib/company/resolveCompanyMembership.ts` — checks the original owner path first (byte-for-byte unchanged for existing owners), falls back to `company_members` for team members. Repointed all 15 `app/company/*` pages that used to resolve `company_profiles.user_id = auth.uid()` directly at this one helper. `app/company/profile/page.tsx` needed real surgery, not just a query swap: it now loads by `companyId` instead of `user_id` (so a team member sees the real company profile instead of a blank "create a company" form), and saving branches between `UPDATE ... WHERE id = companyId` for an existing company vs. the original `upsert`-by-`user_id` only for a brand-new owner's first save — upserting by `user_id` for a non-owner team member would have silently created a second, orphaned company.
- New `/company/team` (roster, add-by-email — existing account added immediately via a service-role-backed route since arbitrary email lookup isn't opened to client RLS, unknown email creates an invite instead — role changes, remove), added to `CompanySidebar.tsx`.
- `app/company/applications/ApplicationList.tsx` gets a "Schedule Interview" action (date/time/duration/location/notes) next to the existing status buttons; `app/candidate/applications/page.tsx` gets an inline interview badge with Confirm/Decline (new `InterviewActions.tsx`).
- New `components/CalendarView.tsx` — hand-rolled month grid, no calendar library added (plain date math, consistent with this codebase's standing preference for hand-rolled UI, e.g. the Three.js scenes). New `/company/calendar` and `/candidate/calendar` pages feed it each side's interviews plus (company: posted events; candidate: registered events).

**Verified:** `npx tsc --noEmit` and `npm run build` both clean (confirmed 7 new routes in the build output: `/admin/users`, `/api/company/team/add`, `/api/invites/accept`, `/api/invites/preview`, `/candidate/calendar`, `/company/calendar`, `/company/team`). Smoke-tested against the live dev server (migration not yet run, exercising every fallback path): public pages 200, every new auth-gated route redirects unauthenticated requests to login rather than erroring, `/api/invites/preview` returns a clean `{valid:false}` for a nonexistent token rather than crashing when `platform_invites` doesn't exist yet, `/api/invites/accept` and `/api/company/team/add` both fail closed with a clear error for unauthenticated requests.

**Explicitly out of scope, flagged rather than silently dropped:** actual email delivery for any invite type (Resend isn't configured); company ownership transfer; a Support/Moderator platform role (mentioned in Linda's own notes but not one of the confirmed build options); per-member custom permission overrides beyond the 5 fixed role tiers; one person belonging to more than one company at a time.

**Still outstanding:** `supabase/add-roles-invites-and-calendar.sql` needs to run in the Supabase SQL Editor — fourth migration handoff today — followed by the one-off super_admin bootstrap `UPDATE`. Nothing in this feature is live until both happen.

## Files changed
```
A  app/admin/candidate-verification/page.tsx
A  app/admin/invites/page.tsx
A  app/admin/university-applications/page.tsx
A  app/admin/users/page.tsx
A  app/api/company/team/add/route.ts
A  app/api/invites/accept/route.ts
A  app/api/invites/preview/route.ts
A  app/api/university-interest/route.ts
A  app/candidate/applications/InterviewActions.tsx
A  app/candidate/calendar/page.tsx
A  app/candidate/invites/InviteList.tsx
A  app/candidate/invites/page.tsx
A  app/company/calendar/page.tsx
A  app/company/invites/page.tsx
A  app/company/team/page.tsx
A  components/CalendarView.tsx
A  lib/company/resolveCompanyMembership.ts
A  lib/invites/acceptInvite.ts
A  supabase/add-application-journeys.sql
A  supabase/add-roles-invites-and-calendar.sql
A  supabase/add-talent-sourcing-and-verification.sql
A  supabase/fix-candidate-signup-search-path.sql
M  app/(auth)/callback/route.ts
M  app/(auth)/register/page.tsx
M  app/(public)/jobs/[id]/JobDetailView.tsx
M  app/(public)/jobs/[id]/apply/ApplyForm.tsx
M  app/(public)/jobs/[id]/apply/page.tsx
M  app/admin/applications/page.tsx
M  app/admin/dashboard/page.tsx
M  app/admin/jobs/new/page.tsx
M  app/admin/jobs/page.tsx
M  app/admin/learnerships/new/page.tsx
M  app/admin/learnerships/page.tsx
M  app/admin/login/page.tsx
M  app/candidate/applications/page.tsx
M  app/candidate/dashboard/page.tsx
M  app/candidate/profile/page.tsx
M  app/company/applications/ApplicationList.tsx
M  app/company/applications/page.tsx
M  app/company/candidates/CandidateSearch.tsx
M  app/company/candidates/page.tsx
M  app/company/dashboard/page.tsx
M  app/company/events/[id]/edit/page.tsx
M  app/company/events/new/page.tsx
M  app/company/events/page.tsx
M  app/company/invites/page.tsx
M  app/company/jobs/[id]/edit/page.tsx
M  app/company/jobs/new/page.tsx
M  app/company/jobs/page.tsx
M  app/company/messages/page.tsx
M  app/company/profile/page.tsx
M  app/company/training/[id]/edit/page.tsx
M  app/company/training/new/page.tsx
M  app/company/training/page.tsx
M  components/AcademicPortal.tsx
M  components/admin/AdminSidebar.tsx
M  components/candidate/CandidateSidebar.tsx
M  components/candidate/DocumentLibrary.tsx
M  components/company/CompanySidebar.tsx
M  data/constants.ts
M  docs/ROADMAP.md
M  lib/auth/roleRedirect.ts
M  lib/publicAcademic.ts
M  lib/publicJobs.ts
M  lib/scrapers/db-writer.ts
M  lib/supabase/middleware.ts
M  supabase/add-informal-jobs.sql
M  supabase/schema.sql
M  types.ts
M  types/database.ts
```
