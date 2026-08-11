# Spanispace Development Roadmap

**Platform:** Talent Bridge for South African Job Seekers
**Founders:** Linda & Percy | **Location:** Gauteng, South Africa
**Mission:** Empower 100,000+ SA youth with job-ready skills and direct employment pathways by 2030
**Last Updated:** 11 August 2026

---

## Current State (as of 9 August 2026)

The platform is live on Netlify with a full Next.js 16 + React 19 + Supabase stack. The 9 July company-portal audit (applications pipeline, company profile self-service, job management RLS, view/drop-off analytics, company events & training, messaging) is code-complete; whether it's actually live depends on migrations that may still not have been run — see [Outstanding: Production Migrations](#outstanding-production-migrations). A month of further shipping since then went undocumented here: South African jobs/informal work as a first-class candidate profile (PR #3), an applications-visibility fix (PR #5), a training catalogue with paid course levels and the first Terminal School / SpaniSpace Academy courses (PR #7), an isiZulu number-agreement checker (beta), a landing-page redesign, and a candidate auto-apply queue. Separately, **PR #10 is open and unmerged**: a pre-launch security/UX audit that adds a CSP header, fixes broken install icons, corrects a false claim in the cookie notice, and completes `.env.example` — see [PR #10: Pre-Launch Audit](#pr-10-pre-launch-audit-open-unmerged) below for that and the three launch blockers it surfaced that no PR can close. Also same day: [Phase 1](#phase-1--growth--retention-q3q4-2026) items 1.1 (email notifications), 1.2 (data freshness), 1.4 (profile-completeness nudges) went from roadmap entries to code-complete, and 1.3 (Google OAuth) shipped scoped to candidates — all four still need the new migration below applied before they do anything live. Also fixed: issue #2 (missing favicon) and confirmed issue #1 (SA jobs sorting) already resolved in code — see [PR #10: Pre-Launch Audit](#pr-10-pre-launch-audit-open-unmerged). And the pre-registration ["waitlist" flow was removed entirely](#waitlist-removed-9-aug-2026) now that real login exists.

### What's Built

| Area | Status | Details |
|------|--------|---------|
| Public site | ✅ Live | Home, Jobs, Training, Academic, Events, Legal pages |
| Auth system | ✅ Live | Supabase email/password auth, role-based routing, forgot/reset password |
| Candidate portal | ✅ Live | Dashboard, profile, multi-document library, applications, enrollments, AI CV audit, messages |
| Company portal | ✅ Live | Dashboard, job posting/editing, candidate search, applications, events, training, messages, profile |
| Admin panel | ✅ Live | Jobs, trainings, learnerships, late uni apps, applications, events (new), vetting queues |
| Database | ✅ Live | 19 tables, RLS policies, Supabase PostgreSQL |
| i18n | ✅ Live | English + isiZulu, 157+ strings |
| File uploads | ✅ Live | Multi-document library (CV, certificates, cover/motivational letters) via Supabase Storage |
| Legal | ✅ Live | POPIA-compliant Privacy Policy + SA Terms of Service |
| Waitlist | ❌ Removed 9 Aug 2026 | Real registration/login replaced it — see below |
| Job/event auto-refresh | ✅ Live | Daily GitHub Actions scraper (RemoteOK, Remotive, Adzuna, Eventbrite → Supabase) — not previously documented |
| AI CV Audit | ✅ Live | Claude-powered CV review at `/candidate/cv-audit` — not previously documented |
| AI profile-summary builder | ✅ Live | `POST /api/profile-summary`: turns a candidate's piece-job/informal `work_experiences` entries into a professional summary via Claude, auth-gated to the caller's own rows. Shipped alongside PR #3. Not previously documented. |
| Mobile portal navigation | ✅ Live | All three portal sidebars (candidate/company/admin) now collapse to a hamburger drawer on mobile |
| Error boundaries | ✅ Live | `error.tsx` present for public, candidate, company, and admin sections |
| Loading skeletons | ✅ Live | Present on most dashboard/list routes across all portals |
| SA jobs & informal work as a profile | 🟢 Code-complete, migration status unverified | PR #3 (20 Jul 2026): `Piece Job`/`Temporary` job types, job `duration`, candidate `professional_summary`, and a `work_experiences` table so informal/piece work becomes a real work history, not just a CV line. Needs `supabase/add-informal-jobs.sql`. Issue #1 says SA/informal jobs still don't surface near the top of the public board — ranking/sort work may remain even if this migration is applied. Not previously documented. |
| Applications visibility & duplicate-apply fix | 🟢 Code-complete, migration status unverified | PR #5 (22 Jul 2026, closes issue #4): candidates and companies could not see applications they were party to, and candidates could apply to the same job repeatedly. Needs `supabase/fix-application-visibility.sql` (and depends on `supabase/fix-candidate-profile-rls.sql`). Not previously documented. |
| Training catalogue: paid levels + Terminal School courses | 🟢 Code-complete, migration status unverified | PR #7 (7 Aug 2026, closes issue #6): `trainings.level` (Beginner/Advanced) with `is_free` derived by trigger, not a free-standing checkbox; 8 Terminal School tracks (external links) plus the SpaniSpace Academy AI/Tech Careers Bootcamp and AI Foundations course, hosted in-platform at `/training/ai-careers-bootcamp` and `/training/ai-foundations` (the PR description says `/academy` — that route doesn't exist, content actually lives under `/training`). Needs `supabase/add-training-levels.sql`. Not previously documented. |
| Candidate documents table + storage bucket | 🟢 Code-complete, migration status unverified | Backs the multi-document library row above. Needs `supabase/add-documents-table.sql` and `supabase/create-documents-bucket.sql`. Not previously documented as separate migrations. |
| Candidate auto-apply queue | 🟢 Built, migration status unverified | `/candidate/auto-apply`: candidates set preferences (fields, excluded companies, work type, location); a daily service-role matcher stages qualifying jobs in `application_matches` for the candidate to review and click-apply — not a silent auto-submit. Needs `supabase/add-auto-apply.sql`. Not previously documented. |
| URL-field validation bug | ✅ Fixed 10 Jul 2026 | Company profile Website/Logo URL and admin Learnerships/Late-Uni-Apps "Apply Link" fields used `type="url"`, so a scheme-less value (`linkedin.com/x` instead of `https://linkedin.com/x`) triggered native browser validation and silently blocked the whole form's submit — presented as "details wouldn't save" / "keeps saying enter url and doesn't continue". Fixed by switching all four fields to `type="text"` + `lib/normalizeUrl.ts`, which auto-prepends `https://` on save instead of blocking. Sourced from `docs/BETA_LAUNCH_OPS_CHECKLIST.md`, not previously in this table. |
| isiZulu translations | ✅ Live, labelled beta | Not an automated checker — `docs/ISIZULU-REVIEW.md` is a hand-review sheet. Of the 52 isiZulu strings added 8 Aug 2026, every one was checked against dictionaries and a noun-class concord table (catching 4 wrong number forms), and the process separately caught a half-English string (`course.read` rendered "49 min yokufunda") that shipped code never surfaced. None of it has been read by a first-language speaker yet — that's the actual outstanding step, not further automated checking. **Next action:** hand `docs/ISIZULU-REVIEW.md` to a first-language isiZulu speaker (Percy?), get corrections written into its last column, apply them to `lib/i18n/zu.ts`, remove the BETA marker in `components/LanguageToggle.tsx`. Course lesson content itself (`data/academy.ts`, ~18,000 words) is deliberately English-only — translating it is a separate, much larger, not-yet-decided piece of work. |
| Landing page redesign | ✅ Live | Moved off a generic template look toward a job-board layout; several iterations on the hero (space/galaxy theme, headline stats, institution logos) through 8–9 Aug 2026. Not previously documented. |
| Hero particle background | ✅ Live | `components/HeroCanvas.tsx`, Three.js. Rebuilt 9 Aug 2026 through several rounds of user feedback: fixed a coverage bug where particles clipped out near the edges at close depth (now frustum-clamped per-particle so the field is edge-to-edge at every distance); replaced connecting-lines-and-squares with soft round dust motes (custom `ShaderMaterial`, additive blending); final pass replaced independent per-particle motion with an actual boids simulation (separation/alignment/cohesion, CPU-side, ~260 particles/~67k neighbour-check pairs per frame) plus periodic "startle" impulses that propagate into a group direction change via the alignment rule — a real school/flock behaviour, not simulated by a shader alone since a per-vertex shader can't see other vertices. Mouse position drives a damped camera + scene-tilt parallax throughout. Respects `prefers-reduced-motion`. Not previously documented. |
| Logo shrinking | ✅ Fixed 9 Aug 2026 | Navbar logo looked tiny and "kept shrinking" (Williamson, via Brendon). Not shrinking: `new-logo.png` is a 500x500 canvas where the wordmark fills only the middle 26% of the height, the rest transparent padding, so at `h-12` the visible mark was ~12px and the auth screen over-compensated with `h-50`. Cropped the wordmark to `public/assets/logo-wordmark.png` (416x160) and repointed all six usages. Navbar `h-7 md:h-8`, auth `h-10 md:h-12`. Verified at phone width. |
| Job application pipeline | 🟢 Fixed, needs deploy | Public apply form only wrote to Netlify Forms, never to `applications` — company/candidate application views were always empty for real users. Fixed 9 Jul 2026; needs `supabase/fix-applications-pipeline.sql` run against production. |
| Company profile self-service | 🟢 Fixed, needs deploy | `company_profiles` had no INSERT RLS policy and the signup trigger never created the row — companies could get stuck at "Profile Not Found." Fixed 9 Jul 2026; needs `supabase/fix-company-profile-creation.sql`. |
| Company job management | 🟢 Fixed, needs deploy | `jobs` had no SELECT/UPDATE RLS policy for the owning company — closed/draft jobs didn't show in `/company/jobs`, and both Close/Reopen and Edit Job silently saved nothing. Fixed 9 Jul 2026; needs `supabase/fix-company-jobs-rls.sql`. |
| Job view / drop-off analytics | 🟢 Built, needs deploy | `job_views` + `application_starts` tables, instrumented on the job detail and apply pages, surfaced as a funnel on `/company/dashboard` and per-job columns on `/company/jobs`. Needs `supabase/add-job-analytics.sql`. |
| Company-created events & training | 🟢 Built, needs deploy | `/company/events` and `/company/training` (list/new/edit), submitted as `vetted_status = 'pending'` and reviewed via `/admin/trainings` and the new `/admin/events`. Needs `supabase/add-company-events-training.sql`. |
| Candidate ↔ company messaging | 🟢 Built, needs deploy | One thread per company↔candidate pair, inbox UI in both portals (`/company/messages`, `/candidate/messages`), entry points from candidate search and the applications list. Needs `supabase/add-messaging.sql`. |
| Email notifications | 🟢 Code-complete, migration pending | See [1.1](#11-email-notifications--code-done-migration-pending). Outbox + triggers + GitHub Actions cron via Resend, built 9 Aug 2026. |
| Google OAuth | 🟢 Live for candidates | See [1.3](#13-social-authentication--shipped-for-candidates-companies-still-emailpassword). Companies still email/password by design. |
| Payments (Stripe) | ❌ Not built | `subscription_tier`/`subscription_status` columns exist but are unused/manual |
| Engineering Mentorship Program course | ✅ Live | New SpaniSpace Academy course at `/training/engineering-mentorship`, 6 lessons transcribed from a supplied 12-week DevSecOps-first mentoring curriculum (standards, 4 phases, 4 project portfolios, career-prep phase). Added `academy.mentorship` to `data/academy.ts`, registered in `data/courses.ts` and `data/constants.ts`. Two same-day follow-ups: (1) each project lesson (3, 4, 5) now closes with a "before you call this done" requirement to push a public GitHub repo, write a LinkedIn post, and share on one other platform, codified as a named standard and outcome in lesson 1 too; (2) lesson titles no longer run the timeline and heading into one sentence ("Weeks 4 to 6, Project 1, the personalization and events engine") — a new optional `eyebrow` field on `AcademyModule` carries the week range separately, shown as a small label above the title on the course page and inline with the lesson number on the lesson page. `eyebrow` is optional so the two pre-existing courses are unaffected. 11 Aug 2026. |
| Training content gated behind login + lesson progress | 🟢 Code-complete, migration pending | Lesson pages (`/training/[course]/[lesson]`) previously rendered full `bodyHtml`/`keyTerms`/`activityHtml` to anyone, logged in or not — no auth check existed anywhere on that route. Now: signed-out readers see only the existing teaser (title, hook, outcomes) plus a locked panel with sign-in/register links; full content and a "mark complete" toggle require a session. Completion persists per-user in the new `academy_lesson_progress` table (keyed on `auth.uid()`, not `candidate_profiles.id`, so it works for any role), surfaced as a per-course completed-count on the course page and a "Training Progress" card on `/candidate/dashboard`. Forces `/training/[course]` and `/training/[course]/[lesson]` to render dynamically instead of statically (confirmed in the build output — both flipped from `○` to `ƒ`), which is required for the per-request auth check to actually run. Needs `supabase/add-academy-progress.sql`. 11 Aug 2026. |

### Waitlist removed (9 Aug 2026)

The pre-registration "join the waitlist" flow no longer makes sense now that real registration/login exists, so it was removed rather than kept as a second front door: `/join-waitlist` and the orphaned, never-linked `/coming-soon` page are both deleted, along with their nav/CTA links, the `waitlist` Netlify form, the admin dashboard's "Waitlist Signups" stat, the `DbWaitlist` type, and the sitemap/llms.txt entries. Three placeholder training-catalogue courses whose only destination was `/join-waitlist` (`t1`/`t2`/`t3` — announced-but-never-built SpaniSpace courses) were removed with it rather than repointed, since there's nowhere real for them to go. The `SuccessStories.tsx` CTA button now goes to `/register` instead.

**Deliberately left untouched:** the `waitlist` table, its RLS policies, and `supabase/fix-rls-recursion.sql` (a historical migration patch referencing it). Dropping a live table is a separate, more destructive decision than removing the UI that fed it — this only stops new signups and existing historical data stays intact. `supabase/schema.sql` (the fresh-install baseline) still creates the table too, for the same reason.

### Outstanding: Production Migrations

`supabase/` now has 17 files and this roadmap can no longer tell you from the repo alone which have actually been run against the live project (`rssuacaedvihhpcakuvm`) — that state lives only in Supabase, not in git. Treat every migration below as **unverified** until someone runs the audit query from issue #8 (see [PR #10: Pre-Launch Audit](#pr-10-pre-launch-audit-open-unmerged)) and confirms against the dashboard.

**Highest priority — closes a live privilege-escalation hole (issue #8):**
1. `supabase/fix-security-hardening.sql` — anyone can currently sign up with `role: "admin"` and get full RLS access to every table; the anon key needed to do this is public in every page bundle by design. Read the note at the top of the file before running: an earlier version of this migration dropped candidate profile creation, which the current version restores. Run the audit query at the end of section 1 afterward and demote any admin account that isn't a founder.

**From the 9 July company-portal audit, in dependency order:**
2. `supabase/fix-company-profile-creation.sql`
3. `supabase/fix-applications-pipeline.sql`
4. `supabase/fix-company-jobs-rls.sql`
5. `supabase/add-job-analytics.sql`
6. `supabase/add-company-events-training.sql`
7. `supabase/add-messaging.sql`

**From work shipped between 9 July and 9 August, not previously tracked here:**
8. `supabase/fix-rls-recursion.sql` — admin RLS policies recursed on every query; likely already applied, since the admin panel is marked live and functional, but unconfirmed
9. `supabase/fix-candidate-profile-rls.sql` — candidates had no INSERT policy on their own profile
10. `supabase/fix-application-visibility.sql` — candidates/companies couldn't see applications they were party to; depends on #9
11. `supabase/add-informal-jobs.sql` — SA/informal jobs schema (PR #3)
12. `supabase/add-training-levels.sql` — paid course levels (PR #7)
13. `supabase/add-documents-table.sql` and `supabase/create-documents-bucket.sql` — candidate document library
14. `supabase/add-auto-apply.sql` — auto-apply matching queue

**From Phase 1 (Email notifications, data freshness, profile scoring), shipped 9 Aug 2026:**
15. `supabase/add-notifications-and-profile-scoring.sql` — must run after #6 (`add-messaging.sql`, the new-message trigger reads `message_threads`/`messages`). Safe to run before or after #11 (`add-informal-jobs.sql`) — the scoring trigger reads `professional_summary` dynamically so a not-yet-existing column just scores as missing rather than erroring (this was caught live: the first version of this migration read the column directly and failed with `record "new" has no field "professional_summary"` on a database that hadn't run #11 yet). Without this migration, `.github/workflows/notifications.yml` runs but every send is silently a no-op (empty outbox), and `candidate_profiles.profile_score` stays stuck at 0.

**From the training-content auth gate, shipped 11 Aug 2026:**
16. `supabase/add-academy-progress.sql` — new `academy_lesson_progress` table backing the "mark lesson complete" toggle on gated lesson pages. Independent of every other migration in this list (only references `auth.users`). Without it, `POST /api/academy-progress` returns a 500 and the lesson page's complete button silently fails to persist.

`supabase/schema.sql` is described as updated to match all of the above for fresh environments — worth spot-checking next time someone provisions one, since it hasn't been re-verified against files 8–14 as part of this update.

**Post-migration smoke test** (from `docs/BETA_LAUNCH_OPS_CHECKLIST.md`): apply for a job as a candidate and confirm it appears in `/company/applications`; sign up as a new company and confirm the dashboard loads without redirect looping; close/reopen and edit a job; post a training/event as a company and approve it as admin; message a candidate from search and reply as that candidate.

### PR #10: Pre-Launch Audit (open, unmerged)

Full pre-launch audit of the live site, 9 Aug 2026. Branch `fix/ship-check-launch-blockers`, opened by BrendonM96. Fixes everything fixable in code; three items need a founder because they need database/DNS access, not a PR.

**In the PR, ready to merge:**
- [ ] Review and merge PR #10 — adds a Content-Security-Policy header (`connect-src`/`img-src`/`frame-ancestors`/`base-uri`/`object-src`/`form-action`, no `script-src` yet — see the comment in `next.config.ts` for why), a real app-icon set (192/512/maskable PNG + Apple touch icon), a corrected cookie/analytics claim in the privacy policy, an Information Officer line + Information Regulator complaint link in the privacy policy, and a completed `.env.example` (was missing 8 of 11 vars the code reads). Author flags the CSP specifically as worth a manual render-check before merging — a wrong CSP can blank the page. Still open/unmerged as of this update — merging it is a deploy decision, not something done as part of a code fix.
- [x] **Issue #2 — favicon.** `app/layout.tsx` and `app/manifest.ts` both referenced `/favicon.ico`, but no such file existed anywhere in the repo. Fixed 9 Aug 2026 by adding `public/favicon.ico`, sourced from the existing `public/assets/new-logo.ico` brand asset. If the specific visual complaint behind issue #2 was about something other than a missing/broken icon, it needs a fresh look — the original issue referenced a screenshot that wasn't visible when this was resolved.

**Blockers — code cannot fix these, only a founder with Supabase/DNS access can:**
- [ ] **Issue #8 — privilege escalation via signup.** Anyone can `POST` to the signup endpoint with `role: "admin"` and get a full admin account; the anon key needed is public by design. Run `supabase/fix-security-hardening.sql` section 1 against `rssuacaedvihhpcakuvm`, then run the audit query at the end of that section and demote any admin that isn't Linda or Brendon. See row 1 in [Outstanding: Production Migrations](#outstanding-production-migrations).
- [ ] **Issue #9 — signup confirmation emails never arrive.** Supabase's built-in mailer only delivers to project team members and caps at 2 emails/hour, so no outside user can currently finish creating an account. Fix in the Supabase dashboard: Project `rssuacaedvihhpcakuvm` → Authentication → Emails → SMTP Settings → point at Resend (same account already used for application-confirmation emails via `RESEND_API_KEY`/`EMAIL_FROM`). App code already sends `emailRedirectTo` pointing at `/callback`, so no further code change is needed.
- [ ] **Issue #11 — POPIA Information Officer + DMARC.** Name and register a POPIA Information Officer with the Information Regulator (free) — PR #10's privacy-policy text is written to reference one but a name still needs to be filled in and registered. Add a DNS TXT record: name `_dmarc`, value `v=DMARC1; p=quarantine; rua=mailto:privacy@spanispace.com`.

**Issue #1 — SA/informal jobs buried at the end of the pager:**
- [x] **Sorting fix, code-complete since 18 Jul 2026 (predates this update).** `lib/publicJobs.ts` sorts South African jobs before international ones, and `JobBoard.tsx`'s stable sort preserves that order — SA jobs are already page-1 material, not something newly fixed here, just newly confirmed and documented.
- [ ] **Volume, migration-gated.** The other half of issue #1 — "we haven't posted any jobs [for] a normal South African person... looking for a waitering job" — is addressed by PR #3's 12 seeded informal-work listings, but only once `supabase/add-informal-jobs.sql` (row 11 in Outstanding Migrations) actually runs against production.

**Note on closing these on GitHub:** this environment has no `gh` CLI and no GitHub API write access — issues can be fixed here but not marked Closed from here. Closing #1 and #2 (and merging #10) on GitHub itself is a manual step.

### Tech Stack

- **Frontend:** Next.js 16.1.6 (App Router), React 19.2.3, TypeScript, Tailwind CSS 4
- **Backend/DB:** Supabase (PostgreSQL + Auth + Storage + RLS)
- **AI:** Anthropic Claude (CV audit today; interview simulator/matching planned)
- **Hosting:** Netlify
- **Forms:** Netlify Forms (newsletter — **not** job applications, see above; waitlist removed 9 Aug 2026)
- **Automation:** GitHub Actions daily scraper job (`.github/workflows/daily-scraper.yml`)
- **Validation:** react-hook-form + zod

---

## Immediate Priorities (Q3 2026) — code-complete 9 Jul 2026

> Goal: make the company portal trustworthy end-to-end before selling subscriptions on top of it. Company demand named four things explicitly: job posting, visibility into visits/drop-off, company-run events/training, and messaging with candidates — plus applications submitted, which turned out to be broken at the root. All five are now built; the only remaining step is running the migrations in [Outstanding: Production Migrations](#outstanding-production-migrations) against the live database.

#### 0.1 Fix the Application Pipeline — done
- `ApplyForm.tsx` now inserts into Supabase `applications` for real (DB-backed) jobs; the pre-existing Netlify Forms submission is kept as a best-effort duplicate notification, and remains the sole path for the static fallback job listings that have no `jobs` row to satisfy the foreign key
- Company/candidate application views now reflect real submissions instead of always being empty

#### 0.2 Deploy the Company Profile Fix — code done, migration pending
- `supabase/fix-company-profile-creation.sql` written; not yet run against production

#### 0.2b Fix Company Job Management RLS — code done, migration pending (found during this work)
- `jobs` had no SELECT/UPDATE policy for the owning company, so closed/draft jobs were invisible in `/company/jobs` and both Close/Reopen and Edit Job silently no-op'd under RLS. Fixed via `supabase/fix-company-jobs-rls.sql`

#### 0.3 Job View & Application Drop-Off Tracking — done
- `job_views` + `application_starts` tables, logged client-side (dedup'd per browser session) from the job detail page and the apply form
- `/company/dashboard` shows a views → started → submitted funnel with a completion rate; `/company/jobs` shows per-job Views/Started/Apps columns

#### 0.4 Company-Created Events & Training — done
- `trainings` and `events` both gained `company_id` + `vetted_status`; company submissions default to `pending` and are hidden from public listings until approved
- New company portal pages: `/company/events`, `/company/events/new`, `/company/events/[id]/edit`, `/company/training`, `/company/training/new`, `/company/training/[id]/edit`
- New admin vetting: `/admin/trainings` gained an approve/reject flow (mirroring jobs); `/admin/events` is a new page (none existed before — events were previously scraper-only)

#### 0.5 Candidate ↔ Company Messaging — done
- One thread per (company, candidate) pair (`message_threads` + `messages`), RLS-restricted to the two participants via a `is_thread_party`/`is_thread_participant` helper function pattern (mirrors the existing `is_admin()` approach)
- Shared inbox component (`components/messaging/MessagesInbox.tsx`) used by both `/company/messages` and `/candidate/messages`
- Entry points: "Message" from a candidate's profile card in `/company/candidates`, and from an application row in `/company/applications`
- Not enforced: the original roadmap idea of restricting company-initiated messages to shortlisted candidates only. Companies can currently message any candidate found via search or who applied. Revisit if this becomes a problem.

---

## Roadmap

### Phase 1 — Growth & Retention (Q3–Q4 2026)
> Goal: Convert waitlist signups into active users. Reach 1,000 registered candidates.
>
> 1.1, 1.2 and 1.4 are code-complete (9 Aug 2026) pending `supabase/add-notifications-and-profile-scoring.sql`; 1.3 shipped scoped to candidates only. 1.5 is not started.

#### 1.1 Email Notifications — code done, migration pending
- Application status updates, new message notification, event registration confirmations — all instant, via a DB-trigger-populated `email_notifications` outbox (not Supabase Edge Functions — this repo's actual cron pattern is GitHub Actions + `tsx` scripts, see `.github/workflows/daily-scraper.yml`, reused here as `notifications.yml`)
- Learnership/deadline expiry alerts (7-day and 1-day) — targets the `jobs` table (learnerships live there as `job_type = 'Learnership'`, not the separate admin-only `learnerships` table), notifying the posting company or `poster_email`
- Weekly digest of new jobs matching candidate skills — plain case-insensitive keyword matching against job title/description/requirements, not embeddings (that's Phase 4)
- New templates in `lib/email.ts`, sender in `scripts/run-notification-sender.ts`, producers in `scripts/run-expiry-alerts.ts` / `run-profile-nudges.ts` / `run-weekly-digest.ts`
- No unsubscribe/email-preferences mechanism yet — worth revisiting under [Security & Compliance](#security--compliance) before this reaches meaningful volume

**Tech:** GitHub Actions cron (hourly drain, daily periodic checks, weekly digest) + Resend, matching the existing scraper pattern

#### 1.2 Data Freshness System — code done, migration pending
- Admin: `/admin/jobs` gained multi-select + "extend expiry by N days" (previously the only way to change a job's expiry was delete-and-recreate); explicitly scoped to the `jobs` table only, not the separate `learnerships` table, which has no public consumer today
- Expiring-within-7-days flag, shared between the admin badge, the public Jobs Board badge, and the 1.1 email-alert threshold (`lib/listingFreshness.ts`)
- Public "Last Updated" on the Jobs Board — also fixed a live bug where the JobPosting JSON-LD `datePosted` was `new Date()` on every request instead of the job's real date; added `dateModified` too
- No public Learnerships page — learnerships are filtered from `/jobs` (`job_type = 'Learnership'`), there's no separate learnerships table/page to add a timestamp to

#### 1.3 Social Authentication — shipped for candidates, companies still email/password
- Google OAuth via `supabase.auth.signInWithOAuth`, "Continue with Google" on `/register` (candidate tab only) and `/login`
- Deliberately candidate-only: the roadmap's own reason for wanting this was "most accessible for SA youth" (candidates), and Google OAuth carries no `role`/`company_name` metadata — building it for companies too would mean inventing a first-of-its-kind self-service role-upgrade RPC right next to the exact area issue #8 (admin privilege escalation via signup role) was about. New Google signups fall through the existing hardened trigger's default, landing as `role = 'candidate'` — no trigger changes needed.
- **You still need to**: create an OAuth client in Google Cloud Console, then paste the Client ID/Secret into Supabase Dashboard → Authentication → Providers → Google. Not something achievable from code.

#### 1.4 Profile Completeness Nudges — code done, migration pending
- `candidate_profiles.profile_score` existed in the schema since before this roadmap but was **never written by anything** — read in 3 places (candidate dashboard, company candidate search sort + badge) while permanently 0. Now computed by a DB trigger (`compute_profile_score`) on every insert/update, weighted: skills 20, CV 25, name 15, phone 10, location 10, portfolio 10, summary 10
- Dashboard checklist card (`components/candidate/ProfileCompletenessCard.tsx`) below 70%, shared scoring logic in `lib/profileCompleteness.ts` so the on-page checklist and the 48h nudge email never disagree on what's missing
- 48h-minimum-age, once-a-week-max nudge email via `scripts/run-profile-nudges.ts`

#### 1.5 Public Landing Page Improvements — not started
- Add real learnership and late uni data (not seed data) — sourced weekly from SETA sites
- Add "Spanispace Verified" badge visual to job/learnership tables
- Improve SEO: meta tags, OG images, structured data for job postings (Google Jobs schema — JobPosting JSON-LD already implemented for job detail pages, extend to learnerships/trainings)
  - Specifically: the current logo is wide-format and renders poorly as a link preview on WhatsApp/Twitter/LinkedIn — needs a square or 1200×630 OG image, a design task, not just a meta-tag wiring task. From `docs/BETA_LAUNCH_OPS_CHECKLIST.md`, not previously in this roadmap.
- Add WhatsApp share button on job/learnership listings
- Decide whether the static fallback job listings in `data/constants.ts` are still needed now that the daily scraper populates real jobs, or can be retired. From `docs/BETA_LAUNCH_OPS_CHECKLIST.md`, not previously in this roadmap.

---

### Phase 2 — Monetisation Foundation (Q4 2026)
> Goal: Onboard first 5–10 paying company clients. Validate revenue model.

#### 2.1 Company Subscription Payments
- Stripe integration for monthly billing
- Tier enforcement in middleware (Basic / Pro / Enterprise)
- Billing page in company portal (current plan, upgrade CTA, invoice history)
- Subscription status stored on `company_profiles.subscription_tier` (column exists, currently unused — no billing logic reads or writes it yet)

**Pricing (as designed):**
| Tier | Price | Access |
|------|-------|--------|
| Basic | R500–R1,000/mo | Job posts + limited pool access |
| Pro | R2,000–R5,000/mo | Full candidate search + analytics |
| Enterprise | Custom | Co-branded bootcamps + success fee (10–15% first-year salary) |

#### 2.2 Company Analytics Dashboard
- Builds on the job view/drop-off tracking shipped in 0.3
- Candidate pipeline funnel (views → started → applied → shortlisted → hired)
- Time-to-hire metrics
- Skill gap analysis (what skills are candidates missing for their open roles)
- Export as PDF/CSV report

#### 2.3 Featured Job Listings
- Companies on Pro/Enterprise can pin a job to the top of public board
- "Spanispace Featured" badge on featured listings
- Rotation logic (fair display if multiple featured jobs active)

#### 2.4 Success Fee Tracking (Enterprise)
- Admin records "hire confirmed" event
- Triggers invoice generation for 10–15% success fee
- Simple hire confirmation flow in admin panel

---

### Phase 3 — Skills Verification Engine (Q4 2026–Q1 2027)
> Goal: Differentiate from LinkedIn/PNet with verified, project-based credentials.

#### 3.1 Skill Assessments
- Multiple-choice assessments per skill category (e.g., Excel, Python basics, AI prompting)
- Pass/fail threshold → auto-issue "Spanispace Verified" badge
- Badge stored on candidate profile, visible to companies
- Assessment questions managed by admin

**Schema additions:** `assessments`, `assessment_results`, `badges` tables

#### 3.2 Capstone Project Submission
- Candidate uploads project (GitHub link, ZIP, or hosted URL) per bootcamp
- Admin/mentor reviews and approves
- Approved projects display on public candidate portfolio page

#### 3.3 Public Candidate Portfolio Page
- `/candidates/:id` — public URL candidates can share
- Shows: verified badges, completed projects, skills, work experience
- Optional: GitHub activity embed
- Replaces the need for a standalone portfolio site for most candidates

#### 3.4 Badge Verification API
- Public endpoint: `GET /api/verify/badge/:id` returns badge validity
- Useful for employers to verify without logging in
- QR code on candidate profile linking to verification URL

---

### Phase 4 — AI Matching & Recommendations (Q1 2027)
> Goal: Reduce time candidates spend searching; surface the right opportunities automatically. The platform already has a working Claude integration (CV audit) to build on.

#### 4.1 Skills-Based Job Matching
- On login, candidates see "Recommended for you" section
- Match algorithm: candidate skills array vs job required skills (cosine similarity or embeddings)
- Score shown as match percentage (e.g., "87% match")

**Tech:** Embeddings + pgvector on Supabase

#### 4.2 Skills Gap Recommendations
- After applying to a job, show: "You're missing these 2 skills — here's a short course"
- Link directly to relevant training in the platform
- Personalised dashboard section: "Your next skill to unlock more jobs"

#### 4.3 Smart Learnership Matching
- Filter learnerships by candidate's completed education level (Matric / Diploma / Degree)
- Surface learnerships closing soon that match candidate interests
- Push alert (email + in-app) for high-match learnerships expiring in < 14 days

#### 4.4 Employer Candidate Recommendations
- When company posts a job, auto-surface top 10 matching candidates in their dashboard
- "Recommended Candidates" tab on company jobs view

#### 4.5 AI Interview Simulator (Candidate Tool)
- Extends the existing Claude CV-audit integration to mock interviews: candidate selects job type, gets questions, submits answers
- AI feedback on answer quality, structure (STAR method), and clarity
- Saves session history so candidate can review and improve

---

### Phase 5 — Scheduling & CV Tools (Q2 2027)
> Goal: Remove remaining friction from the hiring process. Messaging itself moved up to [Immediate Priorities](#immediate-priorities--q3-2026) (0.5) given direct company demand.

#### 5.1 Interview Scheduling
- Company proposes 3 time slots via calendar picker
- Candidate confirms preferred slot
- Both parties get calendar invite (iCal attachment via email)
- Integration with Google Calendar (stretch goal)

#### 5.2 CV Builder
- Guided form: personal info, experience, education, skills, projects
- Template selection (1–3 clean SA-appropriate templates)
- Export as PDF
- Auto-populated from existing candidate profile data

---

### Phase 6 — Mobile App (Q3 2027)
> Goal: Reach candidates on mobile-first (majority of SA youth use mobile as primary device).

#### 6.1 React Native App (iOS + Android)
- Core screens: Home feed, Job Board, Apply, Profile, Notifications
- Push notifications for:
  - New matched jobs/learnerships
  - Application status changes
  - New messages
  - Upcoming events
  - Expiry alerts
- Login with Google (priority) + email

#### 6.2 Offline Capability
- Cache job/learnership listings for offline browsing
- Draft application saved locally, submitted when back online

#### 6.3 App Store Launch
- Google Play Store (priority — Android dominant in SA)
- Apple App Store

---

### Phase 7 — Community & Engagement (Q4 2027)
> Goal: Build a sticky platform that candidates return to, not just a job board.

#### 7.1 Hackathons & Community Events
- Admin creates hackathon/challenge events with submissions
- Candidates submit projects, winners get featured + badge
- Company sponsors visible on event page

#### 7.2 Mentorship Programme
- Mentors (vetted professionals) register on platform
- Candidates request mentorship (1 session, topic-specific)
- Simple booking flow + video call link (Zoom/Google Meet)
- Mentor profiles visible to Pro/Enterprise company subscribers

#### 7.3 Cohort-Based Bootcamps
- Live cohort with start/end date, enrolled candidates grouped together
- Progress tracker per cohort
- Peer discussion board per bootcamp

#### 7.4 Employer Branding Pages
- `/companies/:slug` — public employer profile
- Showcases culture, open roles, past hires, testimonials from placed candidates
- Available to Pro/Enterprise subscribers

---

## Non-Feature Work (Ongoing)

### Data Operations
- Daily scraper (GitHub Actions) auto-refreshes jobs and events — monitor its run logs, not just manual curation
- Weekly manual update of learnerships and late university application deadlines (not yet automated)
- Monthly audit of expired jobs — archive or remove
- Monitor SETA sites (INSETA, MerSETA, ETDP SETA) for new learnerships
- Track university late application windows (UCT, Wits, UP, UJ, UNISA)

### Growth & Marketing
- WhatsApp community (Gauteng schools + TVET colleges)
- X/Twitter presence with weekly "New Learnerships" thread
- Partnership outreach: SETA bodies, NSFAS, Harambee Youth Employment
- School/university career centre partnerships

### Security & Compliance
- Regular dependency updates (npm audit)
- POPIA compliance review as features are added (especially messaging, now scheduled for 0.5)
- Rate limiting on public API endpoints (job posting, applications, cv-audit)
- Input sanitisation audit before messaging goes live

### Infrastructure
- Set up staging environment (separate Supabase project + Netlify preview)
- Monitoring: Uptime Robot or BetterStack for availability alerts
- Error tracking: Sentry integration
- Performance: Lighthouse audits quarterly, target score > 90

---

## Milestone Summary

| Milestone | Target | Key Deliverable |
|-----------|--------|-----------------|
| Application pipeline fixed + company profile fix deployed | Q3 2026 | `applications` table reflects real submissions; no company stuck at signup |
| Company visibility & self-service parity | Q3 2026 | Job view/drop-off analytics, company-created events/training, messaging live |
| 1,000 registered candidates | Q3–Q4 2026 | Email notifications + Google auth live |
| First 5 paying companies | Q4 2026 | Stripe billing + company analytics |
| 100 verified badges issued | Q1 2027 | Assessment engine live |
| 10,000 registered candidates | Q1 2027 | AI matching + skills gap engine |
| Mobile app beta | Q3 2027 | React Native app on Play Store |
| 50,000 candidates | Q4 2027 | Community features + mentorship |
| 100,000 candidates | 2030 | Full platform maturity |
| Seed funding secured | Q3 2026 | SETA + tech firm partnerships |

---

## Backlog (Unscoped / Future Consideration)

- LinkedIn profile import (auto-populate candidate profile)
- Video intro on candidate profile (30-second pitch)
- Referral programme (candidates invite friends → earn platform credits)
- Diversity & inclusion analytics for companies (EE reporting)
- Government/SETA API integration for automated learnership data
- Employer NPS surveys post-hire
- Alumni network (past candidates who got hired — success stories feed)
- Placement guarantee track ("Job-ready in 6 months or your bootcamp is free")
- Multi-language expansion: Sesotho, Afrikaans, isiXhosa
