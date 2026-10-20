# Spanispace Development Roadmap

**Platform:** Talent Bridge for South African Job Seekers
**Founders:** Linda & Percy | **Location:** Gauteng, South Africa
**Mission:** Empower 100,000+ SA youth with job-ready skills and direct employment pathways by 2030
**Last Updated:** 20 October 2026

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
| Legal | 🟡 Partial | Privacy Policy + SA Terms of Service are live, but the 15 Oct 2026 audit found gaps: no signup consent or age check, no account deletion, no unsubscribe link, no refund policy, no ECT s43 business details, and an unsupported "2,400+ Verified Jobs" hero claim. See [Legal & Compliance Checklist](#legal--compliance-checklist-added-15-oct-2026). |
| Waitlist | ❌ Removed 9 Aug 2026 | Real registration/login replaced it — see below |
| Job/event auto-refresh | ✅ Live, actually working as of 14 Aug 2026 | Daily GitHub Actions scraper (RemoteOK, Remotive, Adzuna, Eventbrite → Supabase). Previously documented as live, but had in fact failed on every single run since it was added in June 2026 (53/53) — `daily-scraper.yml` had no real `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` GitHub secrets, same root cause as the Email Notifications fix below. Fixed the same day; first successful run wrote 71 new jobs, 7 refreshed. **15 Oct 2026:** GitHub warned that this workflow and Email Notifications would be auto-disabled after 60 days without a push (last push 23 Aug, so cutoff around 22 Oct). Added a monthly `.github/workflows/keepalive.yml` that re-enables both through the API. It only takes effect once it's merged to `staging`. |
| Job title/keyword search | ✅ Live | `/jobs` had a job-type dropdown (Full-time/Remote/etc.) and a SA-location toggle, but no way to search by role, e.g. "Pharmacist" — reported by Linda. Added a text input to `components/JobBoard.tsx`, client-side substring match (case-insensitive) against `job.role` and `job.company`, resets to page 1 on change, same filter array data already fetched by `lib/publicJobs.ts` (no new query/migration needed). No `category` field exists on `jobs` (only `job_type`, a fixed enum) so free-text title search was the only fit, not a new category. 14 Aug 2026. |
| Dashboard sidebar logo dark-on-dark | ✅ Fixed 14 Aug 2026 | Candidate/company/admin sidebar logo (`bg-slate-900` background) was rendering the dark `logo-wordmark.png` with no filter, so it was effectively invisible — reported by Linda. Each sidebar's own mobile top bar and `Footer.tsx` already turn the same asset white via `brightness-0 invert` (there's no separate white logo file); the desktop sidebar logo in all three sidebar components was just missing those classes. Added to `CandidateSidebar.tsx`, `CompanySidebar.tsx`, `AdminSidebar.tsx`. |
| AI CV Audit | ✅ Live | Gemini-powered CV review at `/candidate/cv-audit`. Upload-based since 13 Aug 2026 (was paste-only); switched from Claude to Gemini the same day for its free tier — see changelog. |
| AI profile-summary builder | ✅ Live | `POST /api/profile-summary`: turns a candidate's piece-job/informal `work_experiences` entries into a professional summary via Gemini (switched from Claude 13 Aug 2026, see changelog), auth-gated to the caller's own rows. Shipped alongside PR #3. Not previously documented. |
| Mobile portal navigation | ✅ Live | All three portal sidebars (candidate/company/admin) now collapse to a hamburger drawer on mobile |
| Error boundaries | ✅ Live | `error.tsx` present for public, candidate, company, and admin sections |
| Loading skeletons | ✅ Live | Present on most dashboard/list routes across all portals |
| SA jobs & informal work as a profile | ✅ Live, migration confirmed run 13 Aug 2026 | PR #3 (20 Jul 2026): `Piece Job`/`Temporary` job types, job `duration`, candidate `professional_summary`, and a `work_experiences` table so informal/piece work becomes a real work history, not just a CV line. **22 Aug 2026:** `supabase/add-informal-jobs.sql` had also seeded 12 fabricated example job listings (fake companies, `vetted_status: 'verified'`) directly into the live `jobs` table — these had been showing to real visitors as genuine jobs for over a week, and 2 real applications (one from an actual candidate) had already been submitted to them. Linda spotted this, findings surfaced (including the real candidate's contact details) before deleting anything since `applications` cascades on `jobs` delete; all 12 fake listings and their cascaded applications removed from production, the same 6 fabricated entries removed from `data/constants.ts`'s static fallback, and the seed block stripped out of the migration file entirely so it can't recur on a fresh database. See `docs/CHANGELOG/22 AUG 2026 - Signup fix, application journeys, talent sourcing, informal jobs cleanup.md`. |
| Applications visibility & duplicate-apply fix | ✅ Live — all migrations confirmed run 15 Oct 2026 | PR #5 (22 Jul 2026, closes issue #4): candidates and companies could not see applications they were party to, and candidates could apply to the same job repeatedly. Needs `supabase/fix-application-visibility.sql` (and depends on `supabase/fix-candidate-profile-rls.sql`). Not previously documented. |
| Training catalogue: paid levels + Terminal School courses | ✅ Live — all migrations confirmed run 15 Oct 2026 | PR #7 (7 Aug 2026, closes issue #6): `trainings.level` (Beginner/Advanced) with `is_free` derived by trigger, not a free-standing checkbox; 8 Terminal School tracks (external links) plus the SpaniSpace Academy AI/Tech Careers Bootcamp and AI Foundations course, hosted in-platform at `/training/ai-careers-bootcamp` and `/training/ai-foundations` (the PR description says `/academy` — that route doesn't exist, content actually lives under `/training`). Needs `supabase/add-training-levels.sql`. Not previously documented. |
| Candidate documents table + storage bucket | ✅ Live — all migrations confirmed run 15 Oct 2026 | Backs the multi-document library row above. Needs `supabase/add-documents-table.sql` and `supabase/create-documents-bucket.sql`. Not previously documented as separate migrations. |
| Candidate auto-apply queue | ✅ Live — all migrations confirmed run 15 Oct 2026 | `/candidate/auto-apply`: candidates set preferences (fields, excluded companies, work type, location); a daily service-role matcher stages qualifying jobs in `application_matches` for the candidate to review and click-apply — not a silent auto-submit. Needs `supabase/add-auto-apply.sql`. Not previously documented. |
| `candidate_profiles` RLS infinite recursion | 🔴 **Regressed 20 Oct 2026, fix pending in production.** Re-running every migration on 15 Oct ran `fix-security-hardening.sql` after the fix, which put the recursive policy back. Live reads of `candidate_profiles` and `applications` fail with 42P17, so candidates who have a phone get sent to onboarding and the save fails. **Run `supabase/fix-candidate-profile-visibility-recursion.sql` again.** `fix-security-hardening.sql` now uses the safe helper, so this can't happen again. Original 13 Aug write-up below. | Candidate onboarding save ("Just one more step") failed with `infinite recursion detected in policy for relation "candidate_profiles"`. Caused by `fix-security-hardening.sql`'s "Companies read applicant profiles" policy and the `applications` table's own SELECT policy querying each other. Fixed via a new `SECURITY DEFINER` helper `public.company_has_applicant()`, same pattern as `is_admin()`/`has_applied_to_job()`. **Run `supabase/fix-candidate-profile-visibility-recursion.sql` in the Supabase SQL Editor to actually resolve the live error** — see 13 Aug 2026 changelog. |
| URL-field validation bug | ✅ Fixed 10 Jul 2026 | Company profile Website/Logo URL and admin Learnerships/Late-Uni-Apps "Apply Link" fields used `type="url"`, so a scheme-less value (`linkedin.com/x` instead of `https://linkedin.com/x`) triggered native browser validation and silently blocked the whole form's submit — presented as "details wouldn't save" / "keeps saying enter url and doesn't continue". Fixed by switching all four fields to `type="text"` + `lib/normalizeUrl.ts`, which auto-prepends `https://` on save instead of blocking. Sourced from `docs/BETA_LAUNCH_OPS_CHECKLIST.md`, not previously in this table. |
| isiZulu translations | ✅ Live, labelled beta | Not an automated checker — `docs/ISIZULU-REVIEW.md` is a hand-review sheet. Of the 52 isiZulu strings added 8 Aug 2026, every one was checked against dictionaries and a noun-class concord table (catching 4 wrong number forms), and the process separately caught a half-English string (`course.read` rendered "49 min yokufunda") that shipped code never surfaced. None of it has been read by a first-language speaker yet — that's the actual outstanding step, not further automated checking. **Next action:** hand `docs/ISIZULU-REVIEW.md` to a first-language isiZulu speaker (Percy?), get corrections written into its last column, apply them to `lib/i18n/zu.ts`, remove the BETA marker in `components/LanguageToggle.tsx`. Course lesson content itself (`data/academy.ts`, ~18,000 words) is deliberately English-only — translating it is a separate, much larger, not-yet-decided piece of work. |
| Landing page redesign | ✅ Live | Moved off a generic template look toward a job-board layout; several iterations on the hero (space/galaxy theme, headline stats, institution logos) through 8–9 Aug 2026. Not previously documented. |
| Hero particle background | ✅ Live | `components/HeroCanvas.tsx`, Three.js. Rebuilt 9 Aug 2026 through several rounds of user feedback: fixed a coverage bug where particles clipped out near the edges at close depth (now frustum-clamped per-particle so the field is edge-to-edge at every distance); replaced connecting-lines-and-squares with soft round dust motes (custom `ShaderMaterial`, additive blending); final pass replaced independent per-particle motion with an actual boids simulation (separation/alignment/cohesion, CPU-side, ~260 particles/~67k neighbour-check pairs per frame) plus periodic "startle" impulses that propagate into a group direction change via the alignment rule — a real school/flock behaviour, not simulated by a shader alone since a per-vertex shader can't see other vertices. Mouse position drives a damped camera + scene-tilt parallax throughout. Respects `prefers-reduced-motion`. Not previously documented. |
| Logo shrinking | ✅ Fixed 9 Aug 2026 | Navbar logo looked tiny and "kept shrinking" (Williamson, via Brendon). Not shrinking: `new-logo.png` is a 500x500 canvas where the wordmark fills only the middle 26% of the height, the rest transparent padding, so at `h-12` the visible mark was ~12px and the auth screen over-compensated with `h-50`. Cropped the wordmark to `public/assets/logo-wordmark.png` (416x160) and repointed all six usages. Navbar `h-7 md:h-8`, auth `h-10 md:h-12`. Verified at phone width. |
| Job application pipeline | ✅ Live — all migrations confirmed run 15 Oct 2026 | Public apply form only wrote to Netlify Forms, never to `applications` — company/candidate application views were always empty for real users. Fixed 9 Jul 2026; needs `supabase/fix-applications-pipeline.sql` run against production. |
| Company profile self-service | ✅ Live — all migrations confirmed run 15 Oct 2026 | `company_profiles` had no INSERT RLS policy and the signup trigger never created the row — companies could get stuck at "Profile Not Found." Fixed 9 Jul 2026; needs `supabase/fix-company-profile-creation.sql`. |
| Company job management | ✅ Live — all migrations confirmed run 15 Oct 2026 | `jobs` had no SELECT/UPDATE RLS policy for the owning company — closed/draft jobs didn't show in `/company/jobs`, and both Close/Reopen and Edit Job silently saved nothing. Fixed 9 Jul 2026; needs `supabase/fix-company-jobs-rls.sql`. |
| Job view / drop-off analytics | ✅ Live — all migrations confirmed run 15 Oct 2026 | `job_views` + `application_starts` tables, instrumented on the job detail and apply pages, surfaced as a funnel on `/company/dashboard` and per-job columns on `/company/jobs`. Needs `supabase/add-job-analytics.sql`. |
| Company-created events & training | ✅ Live — all migrations confirmed run 15 Oct 2026 | `/company/events` and `/company/training` (list/new/edit), submitted as `vetted_status = 'pending'` and reviewed via `/admin/trainings` and the new `/admin/events`. Needs `supabase/add-company-events-training.sql`. |
| Candidate ↔ company messaging | ✅ Live — all migrations confirmed run 15 Oct 2026 | One thread per company↔candidate pair, inbox UI in both portals (`/company/messages`, `/candidate/messages`), entry points from candidate search and the applications list. Needs `supabase/add-messaging.sql`. |
| Email notifications | 🔴 Migration run, but **not sending**: `RESEND_API_KEY`/`EMAIL_FROM` were never set in Netlify (found 15 Oct 2026, see Issue #9 update) | See [1.1](#11-email-notifications--code-done-migration-pending). Outbox + triggers + GitHub Actions cron via Resend, built 9 Aug 2026. |
| Application journeys (internal vs external) | ✅ Live — all migrations confirmed run 15 Oct 2026 | New candidate-facing distinction between applying fully on Spanispace (`apply_mode = 'on_platform'`) and being sent to an employer/institution's own site (`redirect`, with a lightweight capture form first so admin/company still see a real applicant record, not just a click). `jobs.origin` (`company`/`admin_curated`/`scraped`) drives dashboard visibility — companies only ever see their own; admin sees everything, filterable by source. Fixes a live bug in the same pass: scraped jobs were auto-verified with no admin review and owned by a shared "Spanispace Curated" company account, so whoever controlled that login could see every scraped job's applicants — now `company_id = NULL`, `vetted_status = 'pending'`, admin-only. The standalone `learnerships` table (never actually shown to candidates — dead code) is merged into `jobs` (`job_type = 'Learnership'`); Colleges/Universities (`late_uni_apps`) stays fully separate per Linda, with its own new `university_application_interests` capture table and read-only admin view. Needs `supabase/add-application-journeys.sql` — see row 0b in [Outstanding: Production Migrations](#outstanding-production-migrations). 22 Aug 2026. |
| Talent sourcing & verification | ✅ Live — all migrations confirmed run 15 Oct 2026 | Two more candidate journeys, requested same day: **Direct Talent Sourcing** — companies could previously only see candidates who'd applied to one of their jobs (`company_has_applicant()`, a deliberate RLS hardening pass, not an oversight). New opt-in toggle (`candidate_profiles.open_to_offers`, candidate-controlled) makes a candidate additionally visible/invitable without gating on verification. New `job_invites` table (company invites a candidate to apply for a specific job) is deliberately separate from `applications` — an invite is a signal, accepting one just routes into that job's normal apply flow, so `applications` stays the single hiring-pipeline source of truth. **Candidate Document Verification** — `candidate_profiles.verified` has existed since the base schema and been displayed in 4 places, but nothing ever set it true until now; three new `candidate_documents` types (`id_document`/`qualification`/`transcript`) with a `verification_status`, reviewed admin-only (companies never see raw ID documents, only the resulting badge) at `/admin/candidate-verification`, and a standing profile-level "Verified" flip — not redone per application, matching how every other vetted-status workflow in this app already works. Needs `supabase/add-talent-sourcing-and-verification.sql` — see row 0c in [Outstanding: Production Migrations](#outstanding-production-migrations). 22 Aug 2026. |
| Platform roles, org/RBAC, calendar | ✅ Live — all migrations confirmed run 15 Oct 2026 | Three features requested together: can an admin promote a user to admin (no — no admin-user-management UI or API existed at all); are companies multi-user organizations with roles (no — `company_profiles.user_id` was `UNIQUE`, exactly one login per company, no membership table); do we have a calendar for events/meetings/interviews (no — `events` is a public content board like the jobs board, not a scheduler, no calendar UI existed). Built all three: **platform roles** split into Super Admin/Platform Admin (`is_admin()` widened to accept both, so every existing admin policy inherits automatically); **general invites** (`platform_invites`) covering admin→admin, company→team-member, and anyone→referral, deliberately never wired into `handle_new_user()` — acceptance is an explicit `POST /api/invites/accept` call after signup succeeds, since that trigger already caused a production outage once today; **company org/RBAC** — new `company_members` table, real 5-tier hierarchy (Owner/Admin/Manager/Member/Viewer) per Linda's own spec, RLS added *additively* alongside every existing owner-only policy (never replacing them), all 15 `app/company/*` pages repointed at a new shared `lib/company/resolveCompanyMembership.ts` helper; **interview scheduling + calendar** — new `interviews` table (company↔candidate, tied to an application), a hand-rolled `components/CalendarView.tsx` month grid (no new dependency), `/company/calendar` and `/candidate/calendar`. New `/admin/users` and `/company/team` management pages. Needs `supabase/add-roles-invites-and-calendar.sql`, then a one-off manual super_admin bootstrap — see row 0d in [Outstanding: Production Migrations](#outstanding-production-migrations). 22 Aug 2026. |
| Dashboard navigation speed | ✅ Fixed 23 Aug 2026 | Linda reported navigating between pages was slow, not an internet issue. Root cause: `app/candidate/dashboard/page.tsx` and `app/company/candidates/page.tsx` had grown 8+ sequential `await`s (each ~150-300ms against Supabase), summing instead of overlapping — measured RLS overhead separately and ruled it out first. Batched into `Promise.all`; `lib/company/resolveCompanyMembership.ts` now also returns `company_name` so callers stop needing a second round trip. See `docs/CHANGELOG/23 AUG 2026 - Slow navigation, N+1 query chains on dashboard pages.md`. |
| Garbled/mojibake text in job listings | ✅ Fixed 23 Aug 2026 | Linda found unreadable text (`"æ°åªä½è¿"`) in a job listing, then flagged the first-pass fix as too narrow ("all feilds of a job and other related crons... title, or the date, or the salary"). Root cause: multi-byte UTF-8 (CJK text, but also ordinary en-dashes/curly quotes) getting read byte-by-byte as Latin-1 somewhere upstream in the scraper pipeline. New `lib/textQuality.ts` (`repairEncoding()`) detects this via C1 control characters and reverses it; wired into `lib/scrapers/db-writer.ts` for both `writeJobs()` (now covers all 7 text fields, not just title/poster_name) and `writeEvents()` (previously had zero text-quality filtering at all), and into `lib/publicJobs.ts` as read-time defense-in-depth. Live re-scan of all 338 `jobs` rows across every text field found and repaired 155 rows in place (mostly corrupted punctuation in descriptions, not foreign-script); 2 unrecoverable foreign-script rows were removed in the first pass. See `docs/CHANGELOG/23 AUG 2026 - Slow navigation, N+1 query chains on dashboard pages.md`. |
| Per-section profile saving | ✅ Live 23 Aug 2026 | Candidate profile page (`app/candidate/profile/page.tsx`) used one bottom-of-page "Save Profile" button covering 5 unrelated sections, so a one-field edit meant scrolling down to save. Split into independent per-section saves (Personal Information, Talent Pool Visibility — saves instantly on toggle, Skills — saves on add/remove, Online Presence, Professional Profile), matching the self-saving pattern Education/Work Experience already used. Small "Saved ✓" indicator per section instead of one page-wide banner. See `docs/CHANGELOG/23 AUG 2026 - Slow navigation, N+1 query chains on dashboard pages.md`. |
| Google OAuth | ✅ Signup fix run 15 Oct 2026 (was broken 22 Aug) | See [1.3](#13-social-authentication--shipped-for-candidates-companies-still-emailpassword). Companies still email/password by design. **14 Aug 2026: switched off Supabase's hosted redirect flow** — Google's consent screen was showing the raw `rssuacaedvihhpcakuvm.supabase.co` project domain instead of spanispace.com, which read as a phishing attempt. Now uses Google Identity Services + `signInWithIdToken`, entirely client-side on spanispace.com. **22 Aug 2026: every candidate signup (Google or email/password) currently fails** with "Database error saving new user" — `handle_new_user()` lost its `SET search_path = public` clause on 13 Aug, needs `supabase/fix-candidate-signup-search-path.sql` run in production. |
| 404 page | ✅ Replaced 20 Oct 2026 | `app/not-found.tsx` now renders Linda's chosen design from `docs/modern_space_404_page.html`, ported to `components/NotFound404.tsx`: a canvas starfield, a satellite that follows the cursor, a glowing Orbitron "404", a search box that really searches (`/jobs?q=`), Return home / Go back, footer links to Jobs/Services/Training/Events, an optional ambient drone, and the "Asteroid Evader" mini-game (Escape closes it). The placeholder AuraOS branding became Spanispace; Font Awesome (a CDN) became lucide icons; Orbitron is self-hosted via `next/font`; motion is skipped under prefers-reduced-motion. The earlier Three.js astronaut scene (`components/NotFoundScene.tsx`, 14 Aug 2026) is deleted. `/jobs` now honours `?q=`, which also fixes the home page's SearchAction structured data. |
| Payments (Stripe) | ❌ Not built | `subscription_tier`/`subscription_status` columns exist but are unused/manual |
| Spanispace Services marketplace | 🟡 S1–S3 code done 20 Oct 2026, **migrations not run** | Service providers for short jobs (cleaning, laundry, painting, plumbing, 29 categories in total). **S1:** "I offer services" signup or candidate opt-in, a 5-step enrolment wizard (rate card, area, identity, documents, agreement), SAPS police clearance and ID verification in a private bucket, the admin queue at `/admin/service-providers`, a listing switch, and server-side contact-detail blocking. **S2:** home page section, navbar link, `/services`, `/services/[category]`, `/services/provider/[id]` (summary signed-out, full rate card signed-in), backed by safe `security_barrier` views. Needs `supabase/add-service-marketplace.sql`. **S3:** "Request a quote", several provider conversations per request, a shared chat page, server-enforced contact blocking (including numbers split across messages), a provider inbox, and an admin contact-violations page. Also needs `supabase/add-service-requests-messaging.sql`. Offers, the R10 fee and payments (S4–S4b) are not built. See [Phase 2b](#phase-2b--spanispace-services-marketplace-planned-20-oct-2026-s1s3-code-done). |
| Engineering Mentorship Program course | ✅ Live | New SpaniSpace Academy course at `/training/engineering-mentorship`, 6 lessons transcribed from a supplied 12-week DevSecOps-first mentoring curriculum (standards, 4 phases, 4 project portfolios, career-prep phase). Added `academy.mentorship` to `data/academy.ts`, registered in `data/courses.ts` and `data/constants.ts`. Three same-day follow-ups: (1) each project lesson (3, 4, 5) now closes with a "before you call this done" requirement to push a public GitHub repo, write a LinkedIn post, and share on one other platform, codified as a named standard and outcome in lesson 1 too; (2) lesson titles no longer run the timeline and heading into one sentence ("Weeks 4 to 6, Project 1, the personalization and events engine") — a new optional `eyebrow` field on `AcademyModule` carries the week range separately, shown as a small label above the title on the course page and inline with the lesson number on the lesson page, optional so the two pre-existing courses are unaffected; (3) all 23 lessons across all three courses (12 bootcamp, 5 shortcourse, 6 mentorship) were condensed, roughly a third shorter per lesson, cutting redundant framing while keeping every named fact, number, source and link intact — `line-clamp-2` added to card teaser text on the course page and catalogue cards (`components/TrainingSection.tsx`) as a permanent safeguard against uneven card heights, same design system throughout, no layout changes. 11 Aug 2026. |
| Training content gated behind login + lesson progress | ✅ Live — all migrations confirmed run 15 Oct 2026 | Lesson pages (`/training/[course]/[lesson]`) previously rendered full `bodyHtml`/`keyTerms`/`activityHtml` to anyone, logged in or not — no auth check existed anywhere on that route. Now: signed-out readers see only the existing teaser (title, hook, outcomes) plus a locked panel with sign-in/register links; full content and a "mark complete" toggle require a session. Completion persists per-user in the new `academy_lesson_progress` table (keyed on `auth.uid()`, not `candidate_profiles.id`, so it works for any role), surfaced as a per-course completed-count on the course page and a "Training Progress" card on `/candidate/dashboard`. Forces `/training/[course]` and `/training/[course]/[lesson]` to render dynamically instead of statically (confirmed in the build output — both flipped from `○` to `ƒ`), which is required for the per-request auth check to actually run. Needs `supabase/add-academy-progress.sql`. 11 Aug 2026. |
| Compulsory phone/name on signup, forced profile completion after Google | ✅ Live | Register form's candidate phone field had no `required` attribute (full name did) — some candidates ended up with no phone on file, and Google sign-ins (which never supply a phone, and can fall back to an email-prefix "name" if Google's own name is missing) had no way to be asked for one at all. Phone is now `required` in `app/(auth)/register/page.tsx`'s candidate tab. New `app/candidate/onboarding/page.tsx` (mirrors `app/candidate/profile/page.tsx`'s load/save pattern) collects a confirmed/edited display name and a phone number. `lib/supabase/middleware.ts` now queries `candidate_profiles.phone` for every authenticated `/candidate/*` request and redirects to `/candidate/onboarding?next=<path>` whenever it's missing — applies to every candidate account, old or new, not just fresh signups (explicit product decision, see this session's transcript), since `candidate_profiles.phone` deliberately stays nullable at the DB level (a `NOT NULL` constraint would break the `handle_new_user` trigger's Google sign-up path). No migration needed — reuses the existing `"Candidates update own profile"` RLS policy. 11 Aug 2026. |
| "Fill from my CV" profile autofill | ✅ Live | Follow-up to a LinkedIn-import request: LinkedIn's self-serve API only exposes name/email/photo, full import needs Partner Program approval (a business process, not code) — user chose CV-based autofill instead. New `POST /api/cv-extract`: loads a `candidate_documents` row (RLS-scoped), fetches the file from the public `documents` bucket, sends it to Claude (`claude-opus-4-8`) as a native PDF `document` content block (no new npm dependency, no text-extraction library — DOCX/DOC still upload fine for storage via `DocumentLibrary`, just not through this endpoint), and returns structured JSON (name, phone, location, skills, summary, work experience) — it never writes to the DB itself. New shared component `components/candidate/CvAutofill.tsx` handles upload + calls the endpoint + shows an **editable review form**, only calling back to the parent once the candidate confirms ("Use these details") — nothing saves silently. Wired into both `/candidate/onboarding` (fills name/phone only, keeping the compulsory gate narrow) and `/candidate/profile` (fills the full form; work experience entries are inserted directly and the existing `WorkExperience` component is remounted via a key bump to show them, reusing it rather than adding it a new prop). 11 Aug 2026. |
| Split portfolio/LinkedIn/GitHub into 3 fields | ✅ Live | The single "Portfolio / LinkedIn / GitHub URL" input on `/candidate/profile` is now three separate fields (`portfolio_url` unchanged, new `linkedin_url`/`github_url` via `supabase/add-candidate-social-links.sql`). Every one of the 7 places `portfolio_url` touched updated to the "any of the three counts" rule: `lib/profileCompleteness.ts`'s checklist, the `compute_profile_score` DB trigger's 10-point "online presence" bucket, `scripts/run-profile-nudges.ts`'s query, `types/database.ts`, and the company-facing candidate modal in `CandidateSearch.tsx` (now shows up to three links instead of one). `CvAutofill`'s review form and `/api/cv-extract`'s extraction JSON also gained both fields, since CVs commonly list them. 11 Aug 2026. |
| Multi-institution education | ✅ Live | `candidate_profiles.matric_grad_year`/`university` were single flat fields — a candidate with more than one qualification had nowhere to put the second. New one-to-many `candidate_education` table (`supabase/add-candidate-education.sql`), same pattern `work_experiences` already established: new self-contained `components/candidate/Education.tsx` (mirrors `WorkExperience.tsx`'s own load/insert/delete shape) replaces the old two inputs on `/candidate/profile`. Migration includes a one-time backfill of existing `university`/`matric_grad_year` values into the new table so nothing a candidate already entered silently disappears; the old columns are left in place, unused (nothing else in the app read them, confirmed before converting). 11 Aug 2026. |
| +27-prefixed phone inputs | ✅ Live | Every phone/WhatsApp field on the site (register, onboarding, candidate profile, `CvAutofill`'s review form, `WorkExperience`'s reference phone, the public apply form, the post-a-job form) is now a fixed "+27" chip plus a field that only accepts up to 9 digits — typing a letter, space, or a 10th digit is ignored rather than accepted and cleaned up later. New shared `components/PhoneInput.tsx` + `lib/phone.ts` (`toSaLocalDigits`/`toSaPhone`); stored/emitted value is always `+27XXXXXXXXX` or empty. `toSaLocalDigits` best-effort re-derives the 9 digits from old data already saved in other formats (`"071 234 5678"`, `"+27 82 123 4567"`, etc.) so existing values still display correctly in the new input. No migration — same `phone`/`whatsapp`/`reference_phone` columns, just a stricter input. 11 Aug 2026. |
| Onboarding save bug fix | ✅ Fixed | User-reported: `/candidate/onboarding` sometimes showed "We could not save your details" on submit. `app/candidate/onboarding/page.tsx` used `.update()` on `candidate_profiles`, which silently touches zero rows (no error) if that user has no row yet — the actual error the user saw must have been a genuine DB error rather than the 0-row case, but either way `.update()` was the wrong call here: `app/candidate/profile/page.tsx` already uses `.upsert(..., { onConflict: 'user_id' })` for exactly this robustness reason, and onboarding now matches it. Also appended the raw Postgres error message to the on-screen error so a repeat occurrence is diagnosable instead of a dead end. 11 Aug 2026. |
| First Name / Last Name | ✅ Live | The "Full Name" input on the register form, `/candidate/onboarding`, and `/candidate/profile` is now two inputs, First Name and Last Name. Deliberately **UI-only** — `candidate_profiles.full_name` stays one column, joined from the two inputs on save and split back apart (on the first space) for editing, via new `lib/name.ts` (`joinFullName`/`splitFullName`). No migration, no changes to the 7+ places that just read `full_name` as a display string (dashboard, `CandidateSearch.tsx`, emails, the profile preview page) — splitting the actual schema would have rippled into all of them for no real benefit over the join/split approach. 11 Aug 2026. |
| Netlify build warnings cleared | ✅ Fixed | Two warnings seen in a Netlify deploy log: (1) `middleware.ts` is Next 16's deprecated file convention — renamed to `proxy.ts` with the exported function renamed `middleware` → `proxy` (same body, same `config.matcher`), confirmed by the warning no longer appearing in `npm run build` output, which still lists the route table's proxy/middleware line correctly. (2) `@netlify/plugin-nextjs` was pinned behind the latest 5.15.x — bumped via `npm install @netlify/plugin-nextjs@latest`, now `^5.15.13`. 11 Aug 2026. |
| Avatar + "preview my profile" | ✅ Live | No avatar/photo concept existed anywhere before this — every "avatar" in the UI was a letter-initial circle. New `avatar_url` column + public `avatars` Storage bucket (`supabase/add-candidate-avatar.sql`, `supabase/create-avatar-bucket.sql`, 2 MB image-only cap, same RLS pattern as the `documents` bucket) and a new `components/candidate/AvatarUpload.tsx`, wired into `/candidate/profile` (editable) and `/candidate/dashboard`'s header (read-only). New route `/candidate/profile/preview` renders a read-only card (avatar, name, `professional_summary` as bio, skills, education, work experience, social links) — **deliberately self-contained rather than a live reuse of the company-facing candidate view**, since that view is gated by an RLS policy that only lets a company see a candidate who has applied to one of their jobs (`supabase/fix-security-hardening.sql`), which would make a literal "preview as a company sees it" show nothing for anyone who hasn't applied anywhere yet. Both `/candidate/profile` and `/candidate/dashboard` link to the preview. 11 Aug 2026. |

### Waitlist removed (9 Aug 2026)

The pre-registration "join the waitlist" flow no longer makes sense now that real registration/login exists, so it was removed rather than kept as a second front door: `/join-waitlist` and the orphaned, never-linked `/coming-soon` page are both deleted, along with their nav/CTA links, the `waitlist` Netlify form, the admin dashboard's "Waitlist Signups" stat, the `DbWaitlist` type, and the sitemap/llms.txt entries. Three placeholder training-catalogue courses whose only destination was `/join-waitlist` (`t1`/`t2`/`t3` — announced-but-never-built SpaniSpace courses) were removed with it rather than repointed, since there's nowhere real for them to go. The `SuccessStories.tsx` CTA button now goes to `/register` instead.

**Deliberately left untouched:** the `waitlist` table, its RLS policies, and `supabase/fix-rls-recursion.sql` (a historical migration patch referencing it). Dropping a live table is a separate, more destructive decision than removing the UI that fed it — this only stops new signups and existing historical data stays intact. `supabase/schema.sql` (the fresh-install baseline) still creates the table too, for the same reason.

### Outstanding: Production Migrations

> **✅ Cleared 15 Oct 2026:** Linda confirmed that every SQL file below has been run against production, including the 🔴 signup fix (0), 0b–0d, `fix-security-hardening.sql` (1), `fix-cv-completeness.sql` and the rest of 2–19. Nothing in this section is outstanding. Two follow-ups remain unconfirmed: the issue #8 admin-audit query and demotion step, and the super_admin bootstrap `UPDATE` for 0d. The post-migration smoke test at the end of this section also hasn't been run. Everything below is kept as history.

> **🟡 New since that clear-out, not yet run:**
> - `supabase/add-service-marketplace.sql` (20 Oct 2026): Spanispace Services S1 + S2 (service providers, enrolment, verification, the private `provider-documents` bucket, and the public safe-columns views). Nothing existing depends on it, but `/candidate/services`, the enrolment wizard and `/admin/service-providers` won't work until it's run, and `/services` won't list any providers. It has not been run against any database yet, so try it on a staging or branch project first if you can. Safe to re-run.
> - `supabase/add-message-sender-labels.sql` (20 Oct 2026): company ↔ candidate messages show who sent them. The company name replaces the generic "Company", and a team member appears as "Spanispace Curated · Sipho" to the candidate and by full name to colleagues. Company team members (not only the owner login) can now read their company's threads, and send unless they're a Viewer. Until it runs, the inbox still says "Company" and team members still see no threads.
> - `supabase/fix-orphaned-users.sql` (20 Oct 2026, **review before running**, part by part): a read-only audit found 7 `public.users` rows with no sign-in account. Deleting a login didn't remove its app rows, so the `users.id → auth.users` foreign key is likely missing in production. The script moves Linda's CV and 5 work experiences from her dead 11 Aug account to her live one, deletes the 7 orphans (4 diagnostic test accounts, plus duplicates for Linda, Percy and a company address), and restores the foreign key. It has a guard that aborts if the orphan count isn't 7.
> - `supabase/add-service-requests-messaging.sql` (20 Oct 2026): Spanispace Services S3 (requests, conversations, guarded messages, contact violations). **Run it after** the file above. Until then, "Request a quote" errors. See [Phase 2b S1](#phase-2b--spanispace-services-marketplace-planned-20-oct-2026-s1s3-code-done).

`supabase/` now has 21+ files and this roadmap could no longer tell you from the repo alone which have actually been run against the live project (`rssuacaedvihhpcakuvm`) — that state lives only in Supabase, not in git. Treat every migration below as **unverified** until someone runs the audit query from issue #8 (see [PR #10: Pre-Launch Audit](#pr-10-pre-launch-audit-open-unmerged)) and confirms against the dashboard.

**13 Aug 2026 — actually verified, not from the repo:** queried the live database directly via Supabase's own PostgREST API (`GET /rest/v1/candidate_profiles?select=...`, `POST /rest/v1/rpc/<fn>`, etc. — read-only, no writes). This is ground truth, not inference from what the repo says should have been run.

- **Confirmed NOT applied** (live Postgres returned `42703 column does not exist` / `PGRST205 table not found` / `PGRST202 function not found`):
  - `supabase/add-informal-jobs.sql` — no `jobs.duration`, no `candidate_profiles.professional_summary`, no `work_experiences` table at all. The `jobs.job_type` CHECK almost certainly still rejects `'Piece Job'`/`'Temporary'` too (same migration, same transaction). Breaks: Work Experience section on the candidate profile, CV-autofill work-history extraction, informal/piece-job postings.
  - `supabase/add-training-levels.sql` — no `trainings.level`. The paid Beginner/Advanced course-level feature (PR #7) is coded but not live.
  - `supabase/fix-application-visibility.sql` — its `has_applied_to_job()` function doesn't exist (`404 PGRST202`). A candidate re-opening an application to a since-closed job likely sees "job removed" instead of the job.
  - `supabase/create-avatar-bucket.sql` — the `avatars` Storage bucket doesn't exist (`GET /storage/v1/bucket` lists only `cvs` and `documents`, no `avatars`). `AvatarUpload.tsx` fails every upload with "Bucket not found". Missed on the first pass below because Storage buckets live outside the Postgres schema that check queried — confirmed via the Storage API directly (`storage/v1/bucket`), not PostgREST.
- **Confirmed applied** (queried and working): `company_has_applicant()` (13 Aug fix), `is_admin()`, `is_thread_party()`/`is_thread_participant()` (messaging), `candidate_profiles.github_url`/`linkedin_url`/`avatar_url`, `applications.documents`, `trainings.company_id`/`vetted_status`, `events.company_id`/`vetted_status`, and every table added by add-messaging/add-auto-apply/add-job-analytics/add-documents-table/add-academy-progress/add-candidate-education/add-notifications-and-profile-scoring.
- **Action:** ~~run `add-informal-jobs.sql`, then `add-training-levels.sql`, then `fix-application-visibility.sql`, then `create-avatar-bucket.sql` in the Supabase SQL Editor~~ — **user confirmed all four ran, 13 Aug 2026.** Everything else in the list below was already confirmed live and did not need re-running.

**13 Aug 2026, same day, two follow-on bugs found after the migrations landed:**
- Avatar upload ("Upload failed: Bucket not found") is fixed now that `create-avatar-bucket.sql` has run, but a second bug remained: any image that *did* upload often didn't render. Root cause was in the app, not the database — `AvatarUpload.tsx` only checked `file.type.startsWith('image/')`, so a phone photo in HEIC (common iPhone default) would pass that check, then either get rejected by the bucket's `jpeg`/`png`/`webp` allowlist or upload as a format no browser can render in `<img>`. Fixed by resizing and re-encoding every upload to JPEG client-side via canvas before it reaches Storage, regardless of source format — also keeps multi-MB camera photos well under the 2 MB bucket cap automatically.
- The candidate dashboard's "Finish your profile" checklist never checked off "Upload your CV" after a real CV upload. Root cause: `candidate_profiles.cv_url` predates the multi-document library (`candidate_documents`, doc_type `'cv'`) — nothing in the app has written to that column since the library shipped, but the checklist (`lib/profileCompleteness.ts`) and the DB `profile_score` trigger both still read it. Worse, even a corrected check wouldn't have fired: `compute_profile_score()` is a `BEFORE UPDATE` trigger on `candidate_profiles`, and a CV upload only ever touches `candidate_documents`, so the score was never recalculated at upload time regardless of what it checked. Fixed app-side (`lib/profileCompleteness.ts`, `app/candidate/dashboard/page.tsx`, `scripts/run-profile-nudges.ts` now derive a `hasCv` flag from `candidate_documents`) and db-side (`supabase/fix-cv-completeness.sql`, **not yet run in production** — rescopes `compute_profile_score()` to check `candidate_documents` and adds a trigger so uploading/deleting a CV re-touches the owner's `candidate_profiles` row).
- **Fixed:** the same bug on the company side — `app/company/candidates/CandidateSearch.tsx`'s "Download CV" link read the dead `candidate_profiles.cv_url`, and even fixing that alone wouldn't have worked: `candidate_documents` had exactly one RLS policy (owner-only), so no company could read *any* candidate's CV row regardless. `supabase/fix-cv-completeness.sql` now also adds `"Companies read applicant CVs"`, scoped like `"Companies read applicant profiles"` (via `company_has_applicant()`) to `doc_type = 'cv'` only, for applicants only. `app/company/candidates/page.tsx` fetches each applicant's latest `cv` document server-side and merges its `file_url` into `cv_url` before handing candidates to the (unchanged) client component.
- **Fixed:** the avatar resize fix above then failed on every upload, even valid JPEG/PNG, with "Could not read that image." Cause was the CSP, not the file: `next.config.ts`'s `img-src` had no `blob:`, and `resizeImage()` loads the picked file via `URL.createObjectURL()` into a `blob:`-sourced `<img>` to draw it onto a canvas — the browser blocked that load outright before it ever tried to decode anything. Also found and fixed in the same pass: the avatar `<img avatarUrl>` itself points straight at Supabase Storage (not proxied through `next/image`), which wasn't in `img-src` either — fixing only `blob:` would have hit this immediately afterward as a second "uploads fine, still doesn't show." `img-src` now includes `blob:` and `https://*.supabase.co`. Needs a dev server restart / fresh deploy — `next.config.ts` is read at server start, not per-request.

**🔴 URGENT, 22 Aug 2026 — every candidate signup is currently broken in production:**
0. `supabase/fix-candidate-signup-search-path.sql` — Linda reported "almost anyone" trying to sign up via Google hits "Database error saving new user." Reproduced live against `rssuacaedvihhpcakuvm` with throwaway test accounts via the service-role admin API: signup with `role: company` succeeds, signup with `role: candidate` (or no role at all — which is exactly what Google sign-in always sends, since it never sets a `role`) fails 100% of the time, even with a fully-formed name/phone/location. Root cause: `schema.sql`'s `handle_new_user()` was edited 13 Aug 2026 and lost the `SET search_path = public` clause `fix-security-hardening.sql` (8 Aug 2026) had added. The function is `SECURITY DEFINER`, invoked by Supabase's `supabase_auth_admin` role, whose own search_path deliberately excludes `public`. Company signups never hit this because `company_profiles` has no trigger of its own; candidate signups insert into `candidate_profiles`, which fires `compute_profile_score()` (`fix-cv-completeness.sql`), and that function reads an unqualified `candidate_documents` — which fails to resolve without `public` on the path, aborting the whole transaction. This also means the **email/password candidate registration form is equally broken**, not just Google — it just wasn't reported yet. **Run `supabase/fix-candidate-signup-search-path.sql` in the Supabase SQL Editor now** — it's the `fix-security-hardening.sql` definition (allowlisted role + `search_path`) re-applied so it's the last word again. `schema.sql` in the repo has been corrected to match so a future full-schema run doesn't reintroduce this.

**New feature, 22 Aug 2026 — not live until run:**
0b. `supabase/add-application-journeys.sql` — backs the new internal-vs-external application journeys (see the "Application journeys" row in [What's Built](#whats-built) above, and `docs/CHANGELOG/22 AUG 2026 - Signup fix, application journeys, talent sourcing, informal jobs cleanup.md`): `jobs.origin`/`apply_mode` columns and the `university_application_interests` table. Not urgent like 0 above (nothing is broken without it — every write path degrades gracefully to the old columns/behavior), but none of the new redirect-capture, source-filtering, or university-interest-tracking features are actually active until it's run.
0c. `supabase/add-talent-sourcing-and-verification.sql` — backs Direct Talent Sourcing and Candidate Document Verification (see the "Talent sourcing & verification" row in [What's Built](#whats-built) above, and `docs/CHANGELOG/22 AUG 2026 - Signup fix, application journeys, talent sourcing, informal jobs cleanup.md`): `candidate_profiles.open_to_offers`, the new `job_invites` table, and `candidate_documents.verification_status`/new doc types. Also not urgent — every new write path falls back gracefully — but the talent pool, invites, and document verification are all inert until it's run.
0d. `supabase/add-roles-invites-and-calendar.sql` — backs platform roles (Super Admin/Platform Admin), the general invite system, company org/RBAC (5-tier roles), and interview scheduling + calendar (see the "Platform roles, org/RBAC, calendar" row in [What's Built](#whats-built) above, and the same 22 Aug changelog file). Not urgent — every new write path falls back gracefully, and the `lib/supabase/middleware.ts`/`lib/auth/roleRedirect.ts` fixes for super_admin and company-team routing are already live in code regardless. **After running it, also run the one-off bootstrap `UPDATE users SET role = 'super_admin' WHERE email = '...'` for Linda's own account** — nothing on `/admin/users` works, and no one can invite a new admin, until a super_admin exists.

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

**From the profile upgrades (social links, education, avatar), shipped 11 Aug 2026:**
17. `supabase/add-candidate-social-links.sql` — adds `linkedin_url`/`github_url` to `candidate_profiles` and widens the profile-score trigger's "online presence" bucket to count any of the three link fields. Independent of every migration above it.
18. `supabase/add-candidate-education.sql` — new `candidate_education` table (replaces the old single `matric_grad_year`/`university` fields, which are left in place unused) plus a one-time backfill of existing `university`/`matric_grad_year` values into the new table. Safe to run any time after the base schema.
19. `supabase/add-candidate-avatar.sql` and `supabase/create-avatar-bucket.sql` — `avatar_url` column plus a new public `avatars` Storage bucket (2 MB cap, image mime types only), mirroring `create-documents-bucket.sql`'s RLS conventions. Without the bucket migration, `AvatarUpload.tsx` uploads will fail with a bucket-not-found error even though the column exists.

`supabase/schema.sql` is described as updated to match all of the above for fresh environments — worth spot-checking next time someone provisions one, since it hasn't been re-verified against files 8–14 as part of this update.

**Post-migration smoke test** (from `docs/BETA_LAUNCH_OPS_CHECKLIST.md`): apply for a job as a candidate and confirm it appears in `/company/applications`; sign up as a new company and confirm the dashboard loads without redirect looping; close/reopen and edit a job; post a training/event as a company and approve it as admin; message a candidate from search and reply as that candidate.

### PR #10: Pre-Launch Audit (open, unmerged)

Full pre-launch audit of the live site, 9 Aug 2026. Branch `fix/ship-check-launch-blockers`, opened by BrendonM96. Fixes everything fixable in code; three items need a founder because they need database/DNS access, not a PR.

**In the PR, ready to merge:**
- [ ] Review and merge PR #10 — adds a Content-Security-Policy header (`connect-src`/`img-src`/`frame-ancestors`/`base-uri`/`object-src`/`form-action`, no `script-src` yet — see the comment in `next.config.ts` for why), a real app-icon set (192/512/maskable PNG + Apple touch icon), a corrected cookie/analytics claim in the privacy policy, an Information Officer line + Information Regulator complaint link in the privacy policy, and a completed `.env.example` (was missing 8 of 11 vars the code reads). Author flags the CSP specifically as worth a manual render-check before merging — a wrong CSP can blank the page. Still open/unmerged as of this update — merging it is a deploy decision, not something done as part of a code fix.
- [x] **Issue #2 — favicon.** `app/layout.tsx` and `app/manifest.ts` both referenced `/favicon.ico`, but no such file existed anywhere in the repo. Fixed 9 Aug 2026 by adding `public/favicon.ico`, sourced from the existing `public/assets/new-logo.ico` brand asset. If the specific visual complaint behind issue #2 was about something other than a missing/broken icon, it needs a fresh look — the original issue referenced a screenshot that wasn't visible when this was resolved.

**Blockers — code cannot fix these, only a founder with Supabase/DNS access can:**
- [x] **Issue #8 — privilege escalation via signup.** *(SQL run, confirmed 15 Oct 2026. Admin-audit/demotion step and closing the GitHub issue still to confirm.)* Anyone can `POST` to the signup endpoint with `role: "admin"` and get a full admin account; the anon key needed is public by design. Run `supabase/fix-security-hardening.sql` section 1 against `rssuacaedvihhpcakuvm`, then run the audit query at the end of that section and demote any admin that isn't Linda or Brendon. See row 1 in [Outstanding: Production Migrations](#outstanding-production-migrations).
- [ ] **Issue #9 — signup confirmation emails never arrive.** Supabase's built-in mailer only delivers to project team members and caps at 2 emails/hour, so no outside user can currently finish creating an account. Fix in the Supabase dashboard: Project `rssuacaedvihhpcakuvm` → Authentication → Emails → SMTP Settings → enable custom SMTP. **Decided 10 Sep 2026: point it at Zoho, sending as `info@spanispace.com`,** since the domain's mail is already on Zoho — host `smtp.zoho.com` (confirm the regional host in Zoho Mail → Settings → Mail Accounts → IMAP/SMTP; it is `.eu`/`.in`/`.com.au` for accounts created in those data centres), port 465 SSL or 587 STARTTLS, username `info@spanispace.com`, password an **app-specific password** from Zoho Accounts → Security → App Passwords (the normal account password is rejected when 2FA is on). App code already sends `emailRedirectTo` pointing at `/callback`, so no further code change is needed. Three things to check in the same visit:
  - Authentication → Rate Limits → "Emails sent per hour" — custom SMTP lifts the 2/hour built-in cap but this separate limit stays at 30/hour.
  - Authentication → URL Configuration — Site URL must be `https://spanispace.com`, and Redirect URLs must list `https://spanispace.com/callback` and `http://localhost:3000/callback`. Supabase silently ignores an `emailRedirectTo` that isn't allow-listed, so the confirmation link lands in the wrong place until this is set.
  - `EMAIL_FROM` is `Spanispace <apply@spanispace.com>`, so once auth mail sends as `info@`, users see two sender addresses. Left as-is deliberately — aligning them is a branding call, not a bug.

  Zoho Mail is a mailbox service, not a transactional relay: outbound recipients are capped per day (a few hundred on the smaller plans) and burst signup traffic can trip it. Zoho's own answer at volume is ZeptoMail (`smtp.zeptomail.com`); worth revisiting if signups outgrow the cap.
  > **Update 15 Oct 2026, plan changed: use Resend for auth SMTP, not Zoho.** Checking the live Netlify site (`soft-dango-fd7dc2`) showed that **`RESEND_API_KEY` and `EMAIL_FROM` have never been set**. `lib/email.ts` silently skips sending when they're missing, so no transactional email (application notices, notifications, welcome mail) has ever reached a user. Resend has to be set up regardless, so Supabase auth mail will go through it too. That removes the Zoho app password, the regional host lookup and the risk that the Zoho plan doesn't include SMTP. Steps, in order:
  > 1. **Linda:** create a Resend account → Domains → add `spanispace.com` → API Keys → create a key.
  > 2. **Linda:** in Netlify → Environment variables, add `RESEND_API_KEY` (marked secret) and `EMAIL_FROM` = `Spanispace <apply@spanispace.com>`, then redeploy. Claude Code's safety rules block the agent from writing secrets, so this is manual.
  > 3. **Agent, after `npx netlify-cli login`:** add Resend's DNS records in Netlify DNS (`resend._domainkey` TXT, `send` MX + TXT), then verify the domain in Resend.
  > 4. **Linda:** Supabase → Authentication → Emails → SMTP Settings: host `smtp.resend.com`, port `465`, username `resend`, password = the Resend API key, sender `info@spanispace.com`. Also check Rate Limits and URL Configuration (above).
  > 5. Test: sign up with a non-team address and confirm the email arrives.
  >
  > **Also found 15 Oct:** `SUPABASE_SERVICE_ROLE_KEY` was stored in Netlify **without "Contains secret values" ticked**, so it was readable in plain text by anyone on the Netlify team. Linda is marking it secret (the agent was blocked from doing it).
- [ ] **Issue #11 — POPIA Information Officer + DMARC.** Name and register a POPIA Information Officer with the Information Regulator (free) — PR #10's privacy-policy text is written to reference one but a name still needs to be filled in and registered. Add a DNS TXT record: name `_dmarc`, value `v=DMARC1; p=quarantine; rua=mailto:privacy@spanispace.com`.
  > **Update 15 Oct 2026, DNS state checked live:** DNS is hosted on **Netlify DNS** (nameservers `dns1–4.p05.nsone.net`), so records are added at Netlify → Domains → spanispace.com. Present: Zoho MX, `v=spf1 include:zoho.com ~all`, Zoho verification TXT. **Missing:** `_dmarc`, all Resend records, and a Zoho DKIM key. Plan:
  > - Enable DKIM in the Zoho Mail Admin Console (selector `zoho`) and publish its TXT record.
  > - Create a `privacy@spanispace.com` alias in Zoho.
  > - Add DMARC **starting at `p=none`**, not `p=quarantine`: `v=DMARC1; p=none; rua=mailto:privacy@spanispace.com`. Move to `p=quarantine` after 2–4 weeks of reports show Zoho and Resend both passing.
  >
  > **Information Officer:** by default the head of the company (Linda or Percy). Register free on the Information Regulator eServices portal, using the company's registered name and number. Then add the name to section 14 of `app/(public)/privacy/page.tsx`; the same company details also cover compliance checklist #16.

**Issue #1 — SA/informal jobs buried at the end of the pager:**
- [x] **Sorting fix, code-complete since 18 Jul 2026 (predates this update).** `lib/publicJobs.ts` sorts South African jobs before international ones, and `JobBoard.tsx`'s stable sort preserves that order — SA jobs are already page-1 material, not something newly fixed here, just newly confirmed and documented.
- [ ] **Volume, migration-gated.** The other half of issue #1 — "we haven't posted any jobs [for] a normal South African person... looking for a waitering job" — is addressed by PR #3's 12 seeded informal-work listings, but only once `supabase/add-informal-jobs.sql` (row 11 in Outstanding Migrations) actually runs against production.

**Note on closing these on GitHub:** this environment has no `gh` CLI and no GitHub API write access — issues can be fixed here but not marked Closed from here. Closing #1 and #2 (and merging #10) on GitHub itself is a manual step.

> **Update 15 Oct 2026:** PR #10 was in fact merged on 11 Aug 2026 — the "open, unmerged" heading above is stale. Issues #8, #9 and #11 are still founder-side actions.

### Legal & Compliance Checklist (added 15 Oct 2026)

20-item consumer-protection / privacy checklist from Linda, audited against the code on 15 Oct 2026. SA law it mostly maps to: **POPIA** (privacy, consent, children's data, deletion, direct marketing), **CPA** (fees, refunds, misleading claims, reviews) and **ECT Act s43** (business details a website must display). Status: ✅ in place · 🟡 partial · ❌ missing · 🔍 not yet audited.

| # | Item | Status | Finding / next step |
|---|------|--------|---------------------|
| 1 | Privacy policy | 🟡 | `app/(public)/privacy` exists (POPIA rights, retention, AI, documents, scraped jobs). Information Officer is unnamed ("reachable at the address below") — blocked on Issue #11. |
| 2 | Terms of service | ✅ | `app/(public)/terms`, 15 sections incl. AI disclaimer and third-party listings. Review again once paid tiers launch. |
| 3 | Refund policy | ❌ | Terms §6 only says "our refund policy will be communicated at the time of enrolment". Paid training levels exist (PR #7), so a written policy (incl. CPA 5-day cooling-off for online sales, ECT s44) is needed before taking any payment. |
| 4 | Cookie policy | 🟡 | Privacy §8 states essential cookies only, no analytics/advertising cookies. Fine as a section; no separate page needed while that's true. |
| 5 | Cookie consent banner | 🟡 | Not built. With essential-only cookies a full consent banner isn't strictly required, but a one-line notice is good practice. **Becomes mandatory the moment any analytics/marketing script is added.** |
| 6 | Form consents | ❌ | `app/(auth)/register/page.tsx` has no "I agree to the Terms and Privacy Policy" checkbox/notice. The footer newsletter signup (`components/Footer.tsx`) collects emails with no consent wording — POPIA s69 direct-marketing needs opt-in. Applications/redirect capture forms also need a "your details will be shared with {employer}" line. |
| 7 | No unnecessary data (minimisation) | 🔍 | Review every field on candidate onboarding/profile and the redirect-capture form; ID documents (talent verification) are the highest-risk data — confirm retention and admin-only access. **Found 20 Oct 2026:** candidate `id_document`/`qualification`/`transcript` files are stored in the **public** `documents` bucket (`getPublicUrl` in `components/candidate/DocumentLibrary.tsx`), so anyone with a file's URL can open it. Move them to a private bucket with signed URLs, the way Spanispace Services' `provider-documents` works. |
| 8 | Audit third-party SDKs | 🟡 | Client-side third parties found: Google Identity Services (`accounts.google.com/gsi/client`) and Google Fonts via `next/font` (self-hosted at build, no runtime call). Server-side processors: Supabase, Resend, Gemini (CV text), Netlify, Zoho. All need listing in privacy §4 by name, and Gemini's cross-border transfer (POPIA s72) called out. |
| 9 | Remove dark patterns | 🔍 | No audit yet. Check: auto-apply defaults, pre-ticked toggles (`open_to_offers`), how hard account closure is, confirm-shaming copy. |
| 10 | Remove hidden fees | 🔍 | Paid training levels exist — check prices are shown in ZAR, VAT-inclusive, before the user commits. Company Pro/Enterprise tiers are referenced in `llms.txt` but not priced anywhere. |
| 11 | Remove fake reviews | 🔍 | `/success-stories` and `components/SuccessStories.tsx` need checking that every story is a real, consenting person. Precedent: 12 fabricated job listings were found in production on 22 Aug 2026. |
| 12 | Remove unsupported claims | ❌ | `components/Hero.tsx` shows **"2,400+ Verified Jobs"** — the 23 Aug scan found 338 rows in `jobs`, and scraped jobs are `vetted_status = 'pending'`, not verified. Also check "30+ Training Programs" and the other hero stat. Either compute these live or remove them (CPA s41 misleading representation). |
| 13 | Accessibility: alt text | 🔍 | `<img>` tags in `app/(auth)/layout.tsx`, `app/company/profile/page.tsx`, `components/AcademicPortal.tsx`, `components/Navbar.tsx` need an alt check. |
| 14 | Colour contrast | 🔍 | Dark theme uses `text-slate-400` on slate/near-black backgrounds — run Lighthouse/axe against WCAG AA (4.5:1). |
| 15 | Keyboard navigation | 🔍 | Check mobile drawer, CalendarView, modals (`useConfirm`) for focus trap, Esc to close, visible focus rings, and clickable `div`s. |
| 16 | Business details (ECT s43) | ❌ | Footer has no registered name, registration number, physical address, phone or contact email. "About us" and "Partnerships" footer links are dead (`href="#"`). Add a footer block + `/about` or `/contact` page. |
| 17 | Children's data / age consent | ❌ | No age gate or date-of-birth check at signup. POPIA s34–35 requires a competent person's consent for under-18s. Learners/students are a core audience, so decide: 18+ only (add an attestation checkbox) or a guardian-consent flow. |
| 18 | Unsubscribe link in emails | ❌ | `lib/email.ts` sends via Resend with no unsubscribe link or `List-Unsubscribe` header. `schema.sql` has an `unsubscribed_at` column but nothing reads or sets it. Needed for POPIA s69 and for Gmail/Yahoo bulk-sender rules. Transactional mail (password reset) is exempt; notification digests are not. |
| 19 | Licence fonts/images | 🟡 | Archivo and Inter are OFL (fine). Institution logos on the landing page, course images and any stock photos need a source/licence record — logos of universities/SETAs may need permission. |
| 20 | Data deletion request | ❌ | Privacy §7 promises a right to deletion, but there's no "delete my account" button or API anywhere in the app. Build a self-serve request (candidate + company settings) that deletes auth user, profile, documents bucket objects and applications, plus an admin path for emailed requests. |

**Suggested order:** 12 (one-line fix, live misleading claim) → 6 + 17 (signup checkbox covers both) → 16 → 20 → 18 → 3 before any payment → the 🔍 audits (7, 9–11, 13–15) as one accessibility/UX pass.

### Tech Stack

- **Frontend:** Next.js 16.1.6 (App Router), React 19.2.3, TypeScript, Tailwind CSS 4
- **Backend/DB:** Supabase (PostgreSQL + Auth + Storage + RLS)
- **AI:** Google Gemini (CV audit, autofill, profile builder today; interview simulator/matching planned). Switched from Anthropic Claude 13 Aug 2026 for Gemini's free tier.
- **Hosting:** Netlify
- **Forms:** Netlify Forms (newsletter — **not** job applications, see above; waitlist removed 9 Aug 2026)
- **Automation:** GitHub Actions daily scraper job (`.github/workflows/daily-scraper.yml`)
- **Validation:** react-hook-form + zod
- **Branch workflow (since 13 Aug 2026):** feature branches -> `staging` -> `main`, `staging` is now the repo's default branch. Both `main` and `staging` are protected via GitHub branch protection (require a PR to merge; `main` also requires 1 approval, `staging` requires none; admins can bypass either in an emergency; force-push and branch deletion blocked on both). `.github/workflows/ci.yml` runs typecheck + build (blocking) and lint (informational, ~22 pre-existing errors not yet a hard gate) on PRs into either branch. **Outstanding:** Netlify's production-branch/branch-deploy settings still need manual configuration in the Netlify dashboard — no CLI/API access to that account from here. Set Branch deploys to only `staging` (not "All") to actually realize the build-credit savings this whole setup is for.

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
- **Root-caused and fixed 14 Aug 2026: GitHub Actions had zero repository secrets configured, at all.** `gh secret list` returned an empty array. Two GitHub **Environments** named `SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL` existed instead — Environments are a different GitHub feature (deployment protection rules), and creating one with that name does not create a secret `${{ secrets.SUPABASE_URL }}` can read. An earlier same-day pass misdiagnosed this (see the "corrected diagnosis" note in the 14 Aug 2026 changelog) as an intermittent cron-collision race, because `notifications.yml`'s hourly-only step (`run-notification-sender.ts`) checks `isEmailConfigured()` (needs `RESEND_API_KEY`/`EMAIL_FROM`, also never set anywhere including `.env.local`) *before* ever touching Supabase, so it silently no-ops and exits 0 every hour — looking like success while doing nothing. The daily-gated steps (`run-expiry-alerts.ts`, `run-profile-nudges.ts`) have no such guard and failed **every single time they ran**, not intermittently. Fixed by pushing real `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` values (from `.env.local`) as actual repository secrets via `gh secret set`, then verified with a manual `gh workflow run` for both `notifications.yml` and `daily-scraper.yml` — both completed for real this time. The `:20`-past-the-hour cron offset from the earlier pass is harmless and stayed, but wasn't the actual fix.
- **`RESEND_API_KEY` still isn't set anywhere** (confirmed empty in `.env.local` too, not just as a GitHub secret) — the outbox will now populate correctly on every daily run, but nothing will actually send until a real Resend key exists in both places, the same way `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` needed to. Not part of this fix; flagging so it isn't mistaken for done.
- Application status updates, new message notification, event registration confirmations — all instant, via a DB-trigger-populated `email_notifications` outbox (not Supabase Edge Functions — this repo's actual cron pattern is GitHub Actions + `tsx` scripts, see `.github/workflows/daily-scraper.yml`, reused here as `notifications.yml`)
- Learnership/deadline expiry alerts (7-day and 1-day) — targets the `jobs` table (learnerships live there as `job_type = 'Learnership'`, not the separate admin-only `learnerships` table), notifying the posting company or `poster_email`
- Weekly digest of new jobs matching candidate skills — plain case-insensitive keyword matching against job title/description/requirements, not embeddings (that's Phase 4)
- New templates in `lib/email.ts`, sender in `scripts/run-notification-sender.ts`, producers in `scripts/run-expiry-alerts.ts` / `run-profile-nudges.ts` / `run-weekly-digest.ts`
- No unsubscribe/email-preferences mechanism yet (checklist item #18, [Legal & Compliance Checklist](#legal--compliance-checklist-added-15-oct-2026)) — worth revisiting under [Security & Compliance](#security--compliance) before this reaches meaningful volume

**Tech:** GitHub Actions cron (hourly drain, daily periodic checks, weekly digest) + Resend, matching the existing scraper pattern

#### 1.2 Data Freshness System — code done, migration pending
- Admin: `/admin/jobs` gained multi-select + "extend expiry by N days" (previously the only way to change a job's expiry was delete-and-recreate); explicitly scoped to the `jobs` table only, not the separate `learnerships` table, which has no public consumer today
- Expiring-within-7-days flag, shared between the admin badge, the public Jobs Board badge, and the 1.1 email-alert threshold (`lib/listingFreshness.ts`)
- Public "Last Updated" on the Jobs Board — also fixed a live bug where the JobPosting JSON-LD `datePosted` was `new Date()` on every request instead of the job's real date; added `dateModified` too
- No public Learnerships page — learnerships are filtered from `/jobs` (`job_type = 'Learnership'`), there's no separate learnerships table/page to add a timestamp to

#### 1.3 Social Authentication — shipped for candidates, companies still email/password
- "Continue with Google" on `/register` (candidate tab only) and `/login`. **Rebuilt 14 Aug 2026** — see the 14 Aug 2026 changelog entry for the full reason and diff. Was `supabase.auth.signInWithOAuth`, which redirects through Supabase's hosted `/auth/v1/authorize` endpoint; Google's consent screen then shows the redirect URI's domain, which is the raw Supabase project ref (`rssuacaedvihhpcakuvm.supabase.co`), not spanispace.com — reported by Linda as looking like a phishing attempt. Now uses Google Identity Services (`lib/auth/useGoogleSignIn.ts`) to get an ID token client-side and `supabase.auth.signInWithIdToken` to exchange it, so the whole flow — and what Google's screen shows — stays on spanispace.com. No Supabase paid plan needed (the alternative fix, a Supabase custom auth domain, requires Pro).
- Deliberately candidate-only: the roadmap's own reason for wanting this was "most accessible for SA youth" (candidates), and Google sign-in carries no `role`/`company_name` metadata — building it for companies too would mean inventing a first-of-its-kind self-service role-upgrade RPC right next to the exact area issue #8 (admin privilege escalation via signup role) was about. New Google signups fall through the existing hardened trigger's default, landing as `role = 'candidate'` — no trigger changes needed.
- **You still need to**: add `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (the existing Google OAuth Client ID already configured for Supabase's Google provider — reuse it, don't create a new one) to Netlify's environment variables and to `.env.local` for local dev; in Google Cloud Console, add `https://spanispace.com` and `http://localhost:3000` to that same client's **Authorized JavaScript origins** (not a redirect URI — GIS doesn't use one). Full instructions were given in chat. Not something achievable from code alone.

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

### Phase 2b — Spanispace Services marketplace (planned 20 Oct 2026, S1–S3 code done)
> Goal: let verified individuals offer short-term everyday services (cleaning, laundry, painting, plumbing and more) that any user, including companies, can hire. Spanispace earns a flat booking fee from the requester.

Full spec: [project-details.md §7](project-details.md#7-new-feature-spanispace-services).

**Decisions (Linda, 20 Oct 2026):**

| Topic | Decision |
|-------|----------|
| Booking fee | **R10 flat per booking**, any category, any price. Charged to the requester, separate from the service price |
| Payment gateway | **None exists yet.** Pick one in S4.0, and reuse it later for Phase 2.1 subscriptions |
| Criminal check | The **provider uploads a SAPS Police Clearance Certificate**, reviewed by an admin (cheaper than a check service) |
| Middleman disclaimer | **Required.** Spanispace is not responsible for service quality, or for crimes committed by providers or requesters (draft in spec §7.14, needs a lawyer) |
| Categories | **All at launch.** Regulated trades still need a trade certificate per category |
| Company hiring | **Yes, as a separate flow:** Manager+ RBAC, multi-provider and recurring jobs, invoices (tax invoices once VAT-registered), site contact (spec §7.13) |
| Payment journey | **Defined (spec §7.4):**
- one request can have several provider conversations
- each request gets its own chat page, where **both parties accept the terms and the offer**
- R10 is charged on agreement
- providers choose how the **service** is paid: **cash only** (physical money), **online only**, or **cash or online**
- **the R10 is always online, never cash**
- **online:** the service price + R10 is debited at agreement, the provider is not released until the debit succeeds, and the money is held until the job is completed and both confirm, then paid out |
| Gateway fee on online service payments | **The provider pays it**, deducted from the payout and shown upfront (confirmed 20 Oct 2026) |
| Late-cancellation fee | **10% of the service price, minimum R50, maximum R200**, paid to the provider when the requester cancels within 24 hours on an online job (confirmed 20 Oct 2026) |
| Anonymous browsing | **Summary only**. Full profile and messaging need sign-in (confirmed 20 Oct 2026) |
| Police clearance validity | **12 months from the issue date** (confirmed 20 Oct 2026) |
| VAT | **Not registered yet.** No VAT charged or shown. Store `vat_cents = 0` and track 12-month fee turnover (spec §8.1) |
| Legal/tax questions | Tracked in the review register, spec §8 (R1–R8). R1 (holding online money under the NPS Act) blocks S4 online jobs |
| Cash-job late cancellation | **Proposed, awaiting approval:** reliability score, then a commitment deposit after 2 late cancellations in 90 days, then cash bookings blocked for 90 days after 3 (spec §7.7a) |
| Cancellation/refunds | Policy drafted in spec §7.7a. Provider fault means a full refund. A requester cancelling more than 24 hours ahead gets a R10 credit. A requester cancelling within 24 hours gets nothing |

**Ground rules for every step:**
- Contact blocking is enforced on the server, never only in the client.
- Only the payment webhook can confirm a booking or unlock contact.
- Keep company↔candidate `message_threads` untouched. Service chats get their own tables.
- Held online-payment money moves only through these routes: payout on `completed`, refund on cancellation, or an admin's dispute decision. Every move is logged in `job_events` and `service_payouts`.

#### S0 — Legal and terms (do first; blocks S4 go-live, not S1 build)
- [ ] Add a "Spanispace Services" section to `app/(public)/terms`: marketplace role, independent contractors, the R10 fee, the no-circumvention rule, the middleman disclaimer
- [x] Add the Service Provider Agreement page at `/services/provider-agreement`, versioned (`SERVICE_TERMS_VERSION` constant). **Drafted 20 Oct 2026**, marked as a draft on the page, and still needs the attorney review (R2–R5)
- [ ] Add the cancellation policy page at `/services/cancellation-policy` (the spec §7.7a table)
- [ ] Update `app/(public)/privacy`:
  - police clearance as POPIA §26 special personal information, with explicit consent and a retention period
  - service message scanning, and admin access to service threads during disputes
  - the payment gateway as a processor
- [ ] Add a safety guide page for requesters and providers
- [ ] Work through the **Legal and tax review register** (spec §8, items R1–R8) with an SA attorney and an accountant. Record the outcome of each item in the register. Key items:
  - the disclaimer (CPA s48–51 limits)
  - the cancellation policy (ECT s42/s44 cooling-off)
  - VAT: when registration becomes compulsory, and confirming that held service money is collected **as agent**, so it isn't Spanispace's turnover (R6)
  - **whether holding online-job money through a gateway marketplace product is enough under the National Payment System Act** (third-party payment collection)
- [ ] Add the held-funds rules to the Terms: when the money is debited, the 72-hour auto-confirm, the late-cancellation fee (10%, minimum R50, maximum R200), and how disputes are decided
- **Done when:** all four pages are live, and R1–R5 and R7 in the review register are resolved or have an accepted fallback

#### S1 — Foundations: providers, enrolment, verification — code done 20 Oct 2026, migration pending
> **To go live:** run `supabase/add-service-marketplace.sql` in the Supabase SQL Editor. It is safe to re-run. Until then, `/candidate/services` and the wizard error because the tables don't exist. It has **not been run against any database yet**, so test it on a branch or staging project first if possible.

- [x] Migration `supabase/add-service-marketplace.sql`, mirrored into `schema.sql`:
  - **29 categories** seeded (all of them, per Linda), with allowed pricing units per category. 6 regulated categories need a certificate: plumbing, electrical, gas, solar, pest control, security
  - tables `service_providers`, `provider_services`, `provider_rates`, `provider_documents`, `provider_strikes`
  - **Changed from the plan:** verification documents use their own `provider_documents` table and a **private** `provider-documents` bucket, not new `candidate_documents` types. The existing `documents` bucket is public (`getPublicUrl`), and police clearance is POPIA §26 data. Admins open files through 2-minute signed URLs
  - **Changed from the plan:** there is **no public read policy yet.** A provider row holds the date of birth and review notes, and RLS can't hide columns. S2 adds a safe-columns view instead
  - guard triggers so providers can't set their own verification outcome, police clearance dates, ratings or qualification approvals. "Verified" requires an in-date clearance (enforced for admins too), and a listing can only be on while verified
  - the SA ID number is **never stored**. The server derives the date of birth (Luhn-checked) and discards the number
- [x] "I offer services" tab on `app/(auth)/register/page.tsx` (also `/register?as=services`). It creates a normal candidate account and goes to the wizard. `handle_new_user()` is untouched; the provider row is created by `POST /api/services/provider`. Email-confirmation signups get a "Finish setting up your services" banner on `/candidate/dashboard` (driven by the `signup_intent` metadata)
- [x] Opt-in for existing candidates: a "My Services" sidebar link leads to an intro page with a "Start enrolment" button. *(A card on `/candidate/profile` is not added yet.)*
- [x] Enrolment wizard `/candidate/services/enrol`, in 5 steps:
  1. services and rate card
  2. profile, area, travel radius, availability and payment preference
  3. identity (SA ID, or passport + date of birth)
  4. documents (ID or passport + work permit, selfie, police clearance, proof of address, and a trade certificate for each regulated category)
  5. agreement + POPIA consent, then submit

  Locked while under review, and identity is locked once verified. A live contact-detail warning shows while typing. **Since 20 Oct:** steps can't be skipped. Each step is validated before saving, with every problem field highlighted. Required: years and a description per service, a name and price per rate line, a headline, province, city, a work day, identity, and all required documents. The API enforces the same rules. **Portfolio photos moved to S2**, since they need a public, moderated bucket
- [x] 18+ enforced in the API (from the ID or the date of birth) and again by the database trigger on submit
- [x] Admin queue `/admin/service-providers` (sidebar: Service Providers):
  - filters: needs review, verified, changes requested, suspended
  - shows verified providers who uploaded new documents
  - view, approve or reject each document, with a note
  - record the police clearance issue date (expiry = issue + 12 months)
  - approve or reject each regulated category
  - verify, request changes, suspend, lift a suspension
- [x] Provider page `/candidate/services`: status, admin note, clearance expiry, listing on/off switch, rate card, document statuses, strike count
- [x] `lib/services/contactGuard.ts` runs server-side on every profile, service and rate field. `scripts/test-contact-guard.ts` has 77 checks (51 must-block, 22 must-allow, 4 SA ID), all passing. Run it with `npx tsx scripts/test-contact-guard.ts`
- [x] Draft Service Provider Agreement at `/services/provider-agreement` (S0 item), marked as a draft pending legal review
- [ ] **Run the migration**, then test end to end: enrol → upload → admin verify → listing on
- [ ] Clearance expiry doesn't switch `listing_active` off by itself (the trigger only runs on writes). The S2 public view must filter on `police_clearance_expires_at`, and S6 adds the expiry cron
- **Done when:** a candidate can enrol, an admin can verify them, and a verified provider can switch their listing on. Unverified providers appear nowhere publicly. *(Code done; waiting on the migration and an end-to-end test.)*

#### S2 — Discovery — mostly code done 20 Oct 2026, needs the same migration as S1
> The public views are in `supabase/add-service-marketplace.sql` PART F, so the one migration covers S1 and S2. Until it runs, `/services` shows the category tiles and a "verified providers are on their way" message instead of an error.

- [x] **Home page section** (`components/ServicesSection.tsx`, `#services`, right after the jobs board): eyebrow, headline, 8 popular category tiles plus "All services", the 3 steps, a "Bookings open soon" note, and "Browse services" / "Offer your services" buttons. Uses a static category list, so it renders before the migration runs. English and isiZulu strings are added (isiZulu not yet reviewed by a first-language speaker)
- [x] "Services" link in the main navbar, and `/services` plus all 29 category pages in `sitemap.ts`. *(Not yet in `llms.txt`.)*
- [x] `/services` (all categories) and `/services/[category]` (one canonical page per category, with SEO metadata). Filters: category, province, and accepted payment method, using a plain GET form that works without JavaScript. **Not yet:** city or radius search, availability, price or rating filters. Rating can wait until S6 brings reviews
- [x] Provider cards (`components/services/ProviderCardView.tsx`): display name (first name + last initial), photo, headline, up to 3 categories, the "From R45 per m²" lowest price, area and travel radius, "ID and police clearance checked [month year]", rating or "New on Spanispace", and the payment preference
- [x] Provider profile `/services/provider/[id]`:
  - signed-out visitors see the **summary only**, with a "Sign in to see the full rate card" panel
  - signed-in users see the bio, the full rate card grouped by category (with minimum charges and notes), and availability
  - no contact details anywhere, and the disclaimer appears at the bottom
  - the **"Request a quote" button is disabled** with a "Messaging and bookings open soon" note until S3
- [x] Safe public views, enforced in the database:
  - `service_provider_cards`, granted to anon: the summary columns only
  - `service_provider_rate_cards` and `service_provider_profiles`, granted to **authenticated only**, so the summary-only rule isn't just a UI choice
  - all three use `security_barrier`, and only include providers that are verified, listed, have an in-date clearance, and have an approved certificate where one is needed
  - regulated categories only appear once the certificate is approved
- [ ] **Estimator** per category (enter 35 m², see each provider's estimate)
- [ ] Portfolio photos (moved from S1): a public, admin-moderated bucket, with photos approved before they show
- [ ] isiZulu for the `/services` pages themselves (they're English-only for now; the home section is translated)
- [ ] `/login` ignores `?next=`, so after signing in from a provider page you land on the dashboard, not back on the profile
- **Done when:** a signed-out visitor can find a verified provider by category and area, and nothing on the page exposes a phone number, email or link. *(Code done for this; it can only be tested once the migration has run and one provider is verified.)*

#### S3 — Requests and guarded messaging — code done 20 Oct 2026, migration pending
> **To go live:** run `supabase/add-service-requests-messaging.sql` **after** `add-service-marketplace.sql`. It is safe to re-run. The provider page's "Request a quote" button works once both have run.

- [x] `service_requests` (the need: category, description, province/city/**suburb only**, preferred dates, timing notes; status `open`/`booked`/`completed`/`cancelled`) and **several conversations per request**: `service_threads` with (`request_id`, `provider_id`) unique, at most 10 providers per request
- [x] **No client write policies at all** on requests, threads, messages or violations. Parties can only read. Every write goes through `app/api/services/*` with the service role, after the server checks who the caller is. Helpers `is_service_thread_party()` / `is_provider_on_request()` are `SECURITY DEFINER`, so the policies can't recurse
- [x] "Request a quote" on `/services/provider/[id]` (`components/services/RequestQuoteForm.tsx`):
  - pick the service, describe the job, give the area and dates, add an optional message
  - **or add this provider to one of your open requests** for the same category, so quotes can be compared
  - signed-out visitors see "Sign in to request a quote"; providers viewing their own listing and company accounts get a note instead (company hiring is S5)
- [x] Request page `/candidate/services/hire/[id]` (moved from `/services/requests/[id]` on 20 Oct, so the portal sidebar stays; old URLs redirect): the job details, **every conversation side by side** (name, status, last message, unread dot), "Ask another provider", "Cancel request" (closes every conversation). List page `/candidate/services/hire` ("Hire Services" under Services in the candidate sidebar)
- [x] Chat page `/candidate/services/chat/[threadId]` (`components/services/ServiceChat.tsx`), the same page for both parties, with a job panel alongside the chat:
  - polls every 5 seconds, paused while the tab is hidden
  - Enter to send, live contact warning while typing
  - provider can decline; either party can close
  - a "booking opens soon" panel stands in until S4
- [x] `POST /api/services/messages` is the enforcement point. While `contact_unlocked` is false, it scans the message on its own **and joined with the sender's last 4 messages** (`scanWithHistory()`), to catch numbers or emails split across sends. Blocked messages are never delivered: they're logged to `contact_violations` and the sender sees why, with a stronger warning from the 3rd attempt in 7 days. Also: 20 messages a minute, 2,000 characters, no sending in closed threads, and inactive providers can't reply
- [x] The request description, city, suburb, timing notes and opening message are scanned too
- [x] Provider inbox `/candidate/services/inbox` (requester first name via `service_thread_requester_name()`, the only requester detail a provider sees), plus a "Service requests" card with an unread count on `/candidate/services`
- [x] Admin `/admin/service-violations` (sidebar: Contact Violations): blocked messages with reasons, and accounts flagged at 3 or more in 7 days
- [x] `scripts/test-contact-guard.ts` now has 85 checks (8 split-message cases added), all passing
- [ ] **Run the migration** and test: request → reply → try to send a number (blocked, logged) → decline/close/cancel
- [x] **Email notifications (20 Oct 2026):**
  - providers get an email for a new request
  - requesters get a one-off confirmation per request
  - both parties get an email for a new message, throttled to one per unread batch
  - code done, but **nothing sends until Resend is configured in Netlify (Issue #9)**
- [ ] No attachments (deliberate for v1). Message polling, not Supabase Realtime
- **Done when:** a test suite of at least 40 evasion strings is all blocked (51 + 8 split ✅), ordinary job-description text is not (22 + 4 ✅), and a direct Supabase client insert into `service_messages` is refused by RLS (no INSERT policy exists ✅, to be confirmed once the migration has run)

#### S4 — Agreement, payment, unlock
- [ ] **S4.0 Choose the gateway.** Compare Paystack, PayFast, Peach and Yoco on:
  - **hard requirement: holding funds and paying out later to provider bank accounts**, whether through marketplace or split payments, sub-accounts, or a transfers API with account verification
  - the real cost of a **R10 charge**, and of a typical R500–R3,000 online job (fixed plus percentage fees)
  - refund API (full and partial), signed webhooks, sandbox, and onboarding requirements

  Recommendation: Paystack (sub-accounts, transfers), unless the comparison or the legal advice says otherwise. Record the decision here
- [ ] Provider payout onboarding: providers who accept online payment add a bank account, verified through the gateway (account name matched to the ID). Store only the gateway's recipient or sub-account code in `provider_payout_accounts`
- [ ] Migration: add `service_bookings` (status lifecycle per spec §7.5, `platform_fee` copied from `SERVICE_BOOKING_FEE_CENTS = 1000`, `terms_accepted_at`, `disclaimer_accepted_at`), `service_payments` (with an idempotency key) and `service_credits`
- [ ] Build the **Offer panel** in the chat (`service_offers`, versioned):
  - either party can draft an offer: scope, start date, number of days, service price, and the payment method (limited to what the provider accepts)
  - the service price and the R10 Spanispace fee show as separate lines
  - **each party has an "I accept the terms and agree to this offer" button**
  - any edit creates a new version and clears both acceptances
  - `POST /api/services/offers/[id]/accept` creates the booking only when both sides have accepted the same version
- [ ] Checkout at `POST /api/services/bookings/[id]/pay`:
  - **cash job:** charge the R10 online (no cash option for the fee)
  - **online job:** charge the **service price + R10** online in one payment, with the R10 recorded separately as Spanispace revenue and the service price recorded as `service_payouts.status = 'held'`
  - requires the disclaimer and immediate-unlock tick boxes
  - records `vat_cents = 0` and `vat_rate` on every fee charge. Receipts follow a `SPANISPACE_VAT_REGISTERED` setting (currently false, so no VAT is shown)
  - an available credit applies to the R10 only
- [ ] Webhook at `POST /api/services/webhook`: verify the signature, record the payment idempotently, and only then set `confirmed`, `paid_at` and `contact_unlocked = true` (service role). **The provider is not released, notified as booked, or shown the address until this succeeds.** Post a system message in the thread showing both parties' verified phone numbers
- [ ] When a booking is confirmed, post a system message to the requester's **other conversations** under the same request ("The requester has booked another provider") and close them. The request goes to `booked`, and back to `open` if the booking is cancelled
- [ ] Add a cron that expires offers accepted but unpaid for 48 hours
- [ ] Implement the cancellation rules from spec §7.7a, including the held-price rules:
  - full refund if the requester cancels more than 24 hours ahead
  - if the requester cancels within 24 hours or is absent, refund minus a late-cancellation fee to the provider (10%, minimum R50, maximum R200, confirmed)
  - full refund if the provider is at fault
  - refunds through the gateway API
  - R10 credits, at most one per 30 days, expiring after 12 months
  - provider strikes, plus `requester_strikes` and the reliability score
  - **if approved:** the cash-job escalation (a commitment deposit after 2 late cancellations in 90 days, then cash bookings blocked after 3)
- [ ] Email receipts through `lib/email.ts`, with a link to the cancellation policy (depends on Resend being configured, see Issue #9)
- [ ] Add a requester bookings page at `/services/bookings`
- **Done when:**
  - a sandbox payment unlocks contact, and replaying the same webhook does not double-process
  - a failed online debit leaves the provider unreleased and the thread locked
  - an offer accepted by one side only creates no booking, and editing an offer clears both acceptances
  - a provider cancellation refunds the service price and the R10
  - a requester cancelling more than 24 hours ahead gets the service price back plus a R10 credit

#### S4b — Job tracking and payouts
- [ ] Migration: add `job_events` (append-only, no UPDATE/DELETE policy) and `service_payouts`, plus `start_code_hash`, `marked_complete_at`, `confirmed_complete_at` and `auto_confirm_at` on `service_bookings`
- [ ] Build the job page `/services/jobs/[bookingId]` for both parties, with the timeline from spec §7.15:
  - scheduled
  - on the way
  - **started, via the requester's 4-digit start code**
  - in progress, with a daily check-in for multi-day jobs and notes and photos
  - issue raised (a price change means a new offer version, and an online difference is charged or refunded)
  - marked complete (needs an "after" photo where relevant)
  - confirmed complete
  - disputed
  - closed
- [ ] Add `POST /api/services/jobs/[id]/event`, which enforces who may trigger each step and in what order (server-side; the client only shows buttons)
- [ ] **Online payout:** on `completed` (the requester confirms, or 72 hours of silence after "marked complete"), start a gateway transfer for the service price minus the gateway processing fee (the provider pays it, shown upfront, confirmed 20 Oct 2026). Track it in `service_payouts`
- [ ] **Cash completion:** the provider taps "Cash received" and the requester confirms. A mismatch gets flagged to an admin
- [ ] **Dispute:** freezes held funds. Admin decisions are release in full, release part and refund the rest, or refund in full, and every decision is logged
- [ ] Timers (cron): no-show flag if the job isn't started within 2 hours of the start time; reminders at 24 and 48 hours; auto-confirm at 72 hours; hide contact details 7 days after closing
- [ ] Add an emergency/report button on the job page (SAPS 10111 and an in-app report)
- **Done when:**
  - an online job runs end to end in the sandbox: debit, held, started with the code, marked complete, confirmed, payout sent
  - a disputed job's money cannot be paid out until an admin decides
  - a requester's silence releases the payout after 72 hours
  - the provider cannot mark a job started without the code (or the requester's "arrived" tap)

#### S5 — Company hiring
- [ ] Migration: add `service_jobs`, and make RLS use `company_members` (Manager or above books, everyone else reads only)
- [ ] Build `/company/services`: browse and shortlist, create a job (site address, site contact, PO reference, access/PPE notes), book several providers (R10 each), set up recurring bookings
- [ ] Only verified companies can book
- [ ] The unlock shares only the designated site contact with the provider
- [ ] Generate **invoices** in the company's registered name. They switch to **tax invoices** with Spanispace's VAT number once it is VAT-registered (spec §8.1). Refunds are issued as credit notes
- [ ] Add a rolling 12-month fee turnover figure to the admin dashboard, with an alert at R800,000 (ahead of the R1m compulsory VAT threshold; check the current figure)
- **Done when:** a verified company Manager can book 3 cleaners for one job and download one invoice, and a company Viewer cannot book

#### S6 — Reputation and safety
- [ ] Add `service_reviews`: only on `completed` bookings, one per party. Company reviews are labelled "Reviewed by a verified business"
- [ ] Add a report button on profiles, threads and bookings, backed by `service_reports` and an admin queue at `/admin/service-reports` (reports, disputes, contact violations)
- [ ] Pause a listing automatically at 3 strikes in 90 days or on a safety report. An admin can suspend instantly
- [ ] Send police clearance expiry reminders at 30 and 7 days. On expiry the badge is removed and the listing paused
- **Done when:** a safety report pauses the listing within one request, and an expired clearance hides the provider from search

#### S7 — Later
- Milestone or deposit payments for long multi-day jobs
- Live location for "on the way"
- A background-check API as an optional upgrade
- R10 credit bundles to reduce gateway overhead
- Monthly invoicing for companies
- Mobile app support

**Dependencies and risks:**
- Resend is not configured (Issue #9), so receipts and notifications won't send until it is.
- Compliance checklist items 3 (refund policy), 6 (consent), 17 (age) and 20 (deletion) all intersect with this phase.
- A R10 fee may be heavily eroded by gateway fees, so check this in S4.0.
- **Holding online-job money** depends on the gateway's marketplace product and on legal advice (S0). If neither works, the fallback is to collect only the R10 online, with the service always paid directly as for cash.
- Contact blocking can be evaded with images or voice. v1 bans attachments before the agreement and relies on reports and strikes.

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
- Work through the [Legal & Compliance Checklist](#legal--compliance-checklist-added-15-oct-2026) (20 items, added 15 Oct 2026)
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
| Spanispace Services live (S0–S4b) | Q1 2027 | Verified providers, guarded multi-conversation requests, R10 booking fee, held online payments with job tracking and payouts |
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
