# 09 Aug 2026

## PR #10 review (pre-launch audit)
- Reviewed PR #10 ("Pre-launch audit fixes, and the 3 blockers only you can clear"), turned it into a todo checklist in `docs/ROADMAP.md`
- Found a gap the PR itself doesn't cover: `app/layout.tsx` and `app/manifest.ts` reference `/favicon.ico`, but no such file exists anywhere in the repo — this is issue #2
- Documented the 3 real launch blockers (issue #8 admin privilege escalation, issue #9 signup emails never arriving, issue #11 POPIA officer + DMARC), each with the exact action needed

## Roadmap sync
- `docs/ROADMAP.md` had gone stale since 9 Jul 2026 (confirmed via `git log --follow`); documented a month of shipped-but-undocumented work: SA jobs/informal-work profiles (PR #3), an applications-visibility fix (PR #5), paid training levels + Terminal School courses (PR #7), an isiZulu concord checker (beta), a landing-page redesign, and the candidate auto-apply queue
- "Outstanding: Production Migrations" expanded from 6 tracked files to 15 — the repo has 16 files under `supabase/`, most untracked by the roadmap
- Read the full GitHub issue/PR history (#1–#11) end to end. Corrected two inaccuracies surfaced by that pass: PR #7's description claims a `/academy` route that doesn't exist (content actually lives under `/training/ai-careers-bootcamp` and `/training/ai-foundations`), and a copy-paste error in the roadmap that credited PR #7 with closing "issues #6/#7" (#7 is the PR itself, not a second issue it closes)
- Documented a previously-unlisted Claude-powered feature: `POST /api/profile-summary`, which turns a candidate's informal work history into a professional summary (shipped alongside PR #3)

## Phase 1 build: email notifications, data freshness, Google OAuth, profile nudges
Built at the user's request, scoped down from "build all of Phase 1" to four of five items after two rounds of clarifying questions (learnerships live under `jobs`, not a separate public page; Google OAuth scoped to candidates only to avoid a novel role-upgrade RPC next to the exact area issue #8 was about).

- **1.1 Email notifications** — new `email_notifications` outbox table; DB triggers populate it instantly for application status changes, new messages, and event registrations; three periodic scripts (`run-expiry-alerts.ts`, `run-profile-nudges.ts`, `run-weekly-digest.ts`) populate it on a schedule; `run-notification-sender.ts` drains it via Resend. New `.github/workflows/notifications.yml` (hourly/daily/weekly), matching the existing scraper's GitHub Actions + `tsx` pattern rather than Supabase Edge Functions, which this repo doesn't use anywhere.
- **1.2 Data freshness** — `/admin/jobs` gained multi-select "extend expiry by N days" (previously the only way to change a job's expiry was delete-and-recreate); a shared 7-day-expiring-soon flag (`lib/listingFreshness.ts`) used by the admin badge, the public Jobs Board badge, and the email-alert threshold; fixed a live bug where the Jobs Board's JobPosting JSON-LD `datePosted` was `new Date()` on every request instead of the job's real date, and added `dateModified`.
- **1.3 Google OAuth** — "Continue with Google" on `/register` (candidate tab only) and `/login`. New Google signups fall through the existing hardened trigger's default (`role = 'candidate'`) — no trigger changes needed. Still needs the founders to create a Google Cloud Console OAuth client and paste the credentials into Supabase Dashboard → Authentication → Providers → Google.
- **1.4 Profile completeness nudges** — `candidate_profiles.profile_score` existed in the schema but was never written by anything (read in 3 places, permanently 0). Added a DB trigger that computes it on every insert/update. Added a dashboard checklist card (`components/candidate/ProfileCompletenessCard.tsx`), sharing its scoring logic with the 48h nudge email via `lib/profileCompleteness.ts` so the two can't disagree about what's missing.

New migration: `supabase/add-notifications-and-profile-scoring.sql`.

## Bugfix found running the migration in production
First run against the live database failed:
```
ERROR: 42703: record "new" has no field "professional_summary"
```
Cause: production hasn't run `add-informal-jobs.sql` yet, so `candidate_profiles.professional_summary` doesn't exist there, and the scoring trigger referenced it directly (`NEW.professional_summary`), which PL/pgSQL resolves at compile time. Fixed by reading the column dynamically via `to_jsonb(NEW) ->> 'professional_summary'` instead — a missing column now reads as `NULL` rather than failing the trigger, matching the "safe regardless of migration order" convention already used in `fix-security-hardening.sql`. The migration file is `CREATE OR REPLACE`/idempotent throughout, so re-running it after the partial failure is safe.

## Files changed
```
M  app/(auth)/login/page.tsx
M  app/(auth)/register/page.tsx
M  app/(public)/jobs/[id]/page.tsx
M  app/admin/jobs/page.tsx
M  app/candidate/dashboard/page.tsx
M  components/JobBoard.tsx
M  docs/ROADMAP.md
M  lib/email.ts
M  lib/i18n/en.ts
M  lib/i18n/zu.ts
M  lib/publicJobs.ts
M  types.ts
A  .github/workflows/notifications.yml
A  components/candidate/ProfileCompletenessCard.tsx
A  lib/listingFreshness.ts
A  lib/profileCompleteness.ts
A  scripts/run-expiry-alerts.ts
A  scripts/run-notification-sender.ts
A  scripts/run-profile-nudges.ts
A  scripts/run-weekly-digest.ts
A  supabase/add-notifications-and-profile-scoring.sql
```
`npx tsc --noEmit`, `npm run lint`, and `npm run build` all pass clean on the new/changed files (pre-existing lint errors in untouched files — `AdminSidebar.tsx`, `CandidateSidebar.tsx`, `CompanySidebar.tsx`, `lib/i18n/context.tsx`, `company/dashboard/page.tsx` — were already present before this session).

## Still outstanding
- `supabase/add-notifications-and-profile-scoring.sql` (and the other 14 migrations listed in `docs/ROADMAP.md#outstanding-production-migrations`) still need to be run in the Supabase SQL Editor against `rssuacaedvihhpcakuvm`
- Google OAuth needs the Google Cloud Console + Supabase dashboard steps above before the button does anything but error
- PR #10 is still open/unmerged
- **Found, not fixed**: `docs/BETA_LAUNCH_OPS_CHECKLIST.md` is a second, independent list of outstanding migrations, last updated 10 Jul 2026 and missing at least 6 files that `docs/ROADMAP.md` now tracks (`fix-rls-recursion.sql`, `fix-candidate-profile-rls.sql`, `add-training-levels.sql`, `add-documents-table.sql`, `create-documents-bucket.sql`, and today's new migration). Two documents tracking the same thing will drift again — worth reconciling or retiring one of them.

---

## Issue resolution pass (later same day)
User asked to resolve all read GitHub issues (#1–#11), then update the roadmap and changelog, then separately asked to remove every occurrence of "waitlist" from the site now that real login/registration exists.

**Important limitation, stated upfront:** this environment has no `gh` CLI installed and no GitHub API write access (`WebFetch` is read-only). Issues can be fixed in code and committed, but **cannot be marked Closed on GitHub from here** — that's a manual step for whoever has repo access.

### Issue #2 — Favicon
`app/layout.tsx` and `app/manifest.ts` referenced `/favicon.ico`, but the file didn't exist anywhere in the repo (found during the earlier PR #10 review). Fixed by copying the existing `public/assets/new-logo.ico` brand asset to `public/favicon.ico`. Caveat: the original issue referenced an attached screenshot that was never visible here — if the complaint was about something other than a missing icon (e.g. a specific visual/color problem), this fix may not be the whole story.

### Issue #1 — SA/informal jobs buried at the end of the pager
Investigated rather than fixed — the sorting half of this was **already resolved in code**, just undocumented: `git log -S"South African jobs come first"` shows the fix landed 18 Jul 2026 (`lib/publicJobs.ts`), one day after the issue was filed. `JobBoard.tsx`'s pagination sort is stable, so that ordering survives to the page. The other half of the complaint (not enough real informal-work listings) is addressed by PR #3's 12 seeded jobs, gated on `add-informal-jobs.sql` actually running in production — still outstanding, not something further code changes can fix.

### Issues #8, #9, #11 — unchanged
No code path exists for these: #8 needs a SQL migration run against the live Supabase project, #9 needs an SMTP setting changed in the Supabase dashboard, #11 needs a named POPIA officer (business decision) and a DNS TXT record. All three remain exactly as documented in `docs/ROADMAP.md`'s PR #10 section — this session made no changes to them.

### Waitlist removed entirely
Reasoning (user's): real registration/login exists now, so a "join the waitlist" front door is redundant and actively confusing.

Removed:
- `app/(public)/join-waitlist/page.tsx` and `app/(public)/coming-soon/page.tsx` (the latter was already orphaned — grepped the whole repo, nothing linked to it, its only reason for removal is that it shared the same `waitlist` Netlify form and reason-for-being as the page being removed)
- The `waitlist` hidden form block in `public/__forms.html`
- The `/join-waitlist` entry in `app/sitemap.ts` and the "Join Waitlist" line in `app/llms-full.txt/route.ts`
- The "Waitlist Signups" stat card and its Supabase query in `app/admin/dashboard/page.tsx`
- The `DbWaitlist` type (confirmed unused elsewhere first) and `AdminStats.totalWaitlist` in `types/database.ts`
- Three training-catalogue placeholder courses in `data/constants.ts` (`t1`/`t2`/`t3`) whose only destination was `/join-waitlist` — announced-but-never-built SpaniSpace courses with nowhere else to send people
- The `SuccessStories.tsx` CTA button: was "Join the Waitlist" → `/join-waitlist`, now "Get Started Free" (`cta.getStarted`, renamed from `cta.joinWaitlist`) → `/register`, in both `lib/i18n/en.ts` and `zu.ts`, with the adjacent subtitle copy lightly adjusted since "be among the first" no longer fit a same-day-signup flow

**Deliberately not touched:** the `waitlist` table and its RLS policies in `supabase/schema.sql`, and the historical patch `supabase/fix-rls-recursion.sql` that references it. Dropping a live table (with potentially real signup data already in it) is a materially more destructive decision than removing the UI that feeds it, and wasn't asked for — this only stops new signups.

Verified clean: `npx tsc --noEmit`, `npm run build` (81 routes instead of 83, `/join-waitlist` and `/coming-soon` confirmed gone from the route list), and `npm run lint` (same 41 pre-existing problems as before, none in any file this pass touched).

### Files changed, this pass
```
D  app/(public)/join-waitlist/page.tsx
D  app/(public)/coming-soon/page.tsx
M  app/admin/dashboard/page.tsx
M  app/llms-full.txt/route.ts
M  app/sitemap.ts
M  components/SuccessStories.tsx
M  data/constants.ts
M  docs/ROADMAP.md
M  lib/i18n/en.ts
M  lib/i18n/zu.ts
M  public/__forms.html
M  types/database.ts
A  public/favicon.ico
```

### Still outstanding
- Everything from the "Still outstanding" section above still applies (migrations, Google OAuth setup, PR #10 unmerged, the two-changelogs-for-migrations issue)
- Issues #1 and #2 are code-resolved but **not closed on GitHub** — needs manual closing, or `gh` CLI installed and authenticated if that should be automated going forward
- Issue #2's fix is a best guess (missing icon) without seeing the original attached screenshot — worth a quick confirm that it addressed the actual complaint
- Nothing was committed or pushed as part of this pass — all changes are local/uncommitted

---

## Reconciled docs/BETA_LAUNCH_OPS_CHECKLIST.md and docs/ISIZULU-REVIEW.md into the roadmap (later same day)
Doc-only pass, no app code changed. User asked to analyse both files and update `docs/ROADMAP.md` with anything outstanding that wasn't already tracked there.

**From `docs/BETA_LAUNCH_OPS_CHECKLIST.md`** (last updated 10 Jul 2026 — most of it was already superseded by what `docs/ROADMAP.md` now tracks, e.g. its "still outstanding" Email Notifications and Google OAuth are both built now). Three genuine gaps found and added:
- A 10 Jul bug fix that was never in the roadmap's "What's Built" table: `type="url"` fields (company profile Website/Logo, admin Learnerships/Late-Uni-Apps Apply Link) silently blocked form submission on scheme-less input — fixed via `lib/normalizeUrl.ts`, now documented as its own row
- OG social card: the roadmap's existing Phase 1.5 "OG images" bullet was generic; added the specific reason it's needed (current logo is wide-format, renders poorly as a link preview on WhatsApp/Twitter/LinkedIn, needs a square/1200×630 image)
- A genuinely untracked decision item: whether the static fallback jobs in `data/constants.ts` are still needed now that the scraper populates real ones — added to Phase 1.5
- Also added the doc's post-migration smoke-test checklist near "Outstanding: Production Migrations", since it's directly actionable once those migrations run

**From `docs/ISIZULU-REVIEW.md`**: corrected a mischaracterization in the roadmap's own isiZulu row — it described an "isiZulu number-agreement checker" as if it were automated tooling; it's actually a hand-review markdown sheet, not code. Rewrote the row to be accurate: 52 strings added 8 Aug, dictionary + concord-table checked (4 number forms fixed), one half-English string caught (`course.read` → `course.minRead`), **none of it read by a first-language speaker yet** — and added the concrete next action (hand the review sheet to a native speaker, apply corrections, remove the BETA marker in `components/LanguageToggle.tsx`). Also noted lesson content in `data/academy.ts` (~18,000 words) is deliberately untranslated, a separate future decision.

**Bonus catch:** the Tech Stack line still said `Netlify Forms (waitlist, newsletter...)` — a leftover from before waitlist was removed earlier today. Fixed in passing.

Files changed: `docs/ROADMAP.md` only.

---

## Updated docs/BETA_LAUNCH_OPS_CHECKLIST.md in place (later same day)
The previous entry updated `ROADMAP.md` using this file as source material but left the file itself untouched — user asked whether it had been updated too. It hadn't; user chose to update it in place rather than retire it.

- Migration list rewritten from 9 items to the current 15, renumbered, with `fix-security-hardening.sql` promoted to a standalone "highest priority" entry (closes the issue #8 privilege-escalation hole) — mirrors the structure `ROADMAP.md`'s own migration list was given earlier today
- Added a note at the top pointing to `docs/ROADMAP.md#outstanding-production-migrations` as the more actively maintained of the two, to check first if they ever disagree
- Moved Email Notifications and Google OAuth from "Still Outstanding" to "Already Resolved," each with what shipped and what's still needed to go live (migration 15; a Google Cloud Console OAuth client). Added Profile Completeness Nudges to the resolved list too, though it wasn't in this doc's original scope
- "Still Outstanding" now only has the two items that are actually still outstanding: OG social card, and the static-jobs-fallback decision
- Fixed a numbering-drift bug in the doc's own cross-reference ("After migration 9, set these in the Netlify dashboard" → "After migration 10", since the security-hardening insert shifted every number after it by one)
- `Last Updated` bumped to 9 August 2026

Files changed: `docs/BETA_LAUNCH_OPS_CHECKLIST.md` only.

---

## Hero particle background rebuilt through several rounds of feedback (later same day)
User asked to improve `components/HeroCanvas.tsx` (the Three.js particle field behind the homepage hero), citing a YouTube short and later a blog post on particles with React Three Fiber/shaders as references. Iterated in four passes, each verified against a real browser render rather than just reading the code:

1. **Coverage + travel + mouse steering.** The old field spawned particles in a fixed-size box, which clipped near particles at the sides while far ones stayed safely inside the camera frustum — it read as "only in one place" rather than spanning the hero. Fixed by clamping each particle's spawn/bounce bounds to the actual frustum width *at its own depth*, computed per-frame. Added forward drift-and-recycle (particles drift toward the camera, respawn far away on arrival) for a "travelling through space" feel, and blended camera-position drift with the existing scene-tilt for mouse steering.
2. **Style change.** User clarified they wanted a "dust" look, not the constellation lines-and-squares style from pass 1. Dropped the connecting-line geometry entirely, replaced `PointsMaterial`'s hard square points with a soft circular glow (first via a canvas-generated radial-gradient texture, later via a shader `smoothstep` falloff), additive blending so overlapping dust glows instead of stacking flat.
3. **Shader-driven organic motion**, referencing the linked Maxime Heckel article on R3F/shader particles. Moved from `PointsMaterial` to a custom `ShaderMaterial` with an embedded classic simplex-noise function (Ashima Arts/Ian McEwan, MIT), animated by a `uTime` uniform, displacing each particle's position in the vertex shader for "warp and move on their own." Point-size calibration took three screenshot-verified iterations (first attempt: massive overlapping blurry orbs swallowing the hero text; second: undershot to barely-visible pinpricks; landed on `uSize=1.6`, a `150.0` distance-scale constant, `×0.8` fragment opacity).
4. **Boids flocking**, the final ask: "a school of fish... sudden grouped change of direction." A per-vertex shader can't see other vertices, so noise-based independent motion could never produce real flocking — moved the motion entirely back to the CPU as an actual Reynolds boids simulation (separation + alignment + cohesion, naive O(n²) neighbour scan, ~260 particles), added periodic random "startle" impulses to a few particles that then propagate to neighbours via the alignment rule over subsequent frames — a real emergent group-turn, not a scripted one. Dropped the shader noise-warp from pass 3 entirely rather than layering it on top, since it would have blurred the coordinated-motion read with per-particle independent wander. Rendering (dust motes, mouse steering) carried over unchanged.

**Verification method**, since this is a visual/behavioural change with no existing project skill for driving a browser: installed Playwright into the scratchpad (not the project) each round, launched the dev server, drove headless Chromium to the homepage, screenshotted the hero at multiple points in time (and after simulated mouse movement), and read `console --errors` — never declared a pass on code-reading alone.

**Incident, caught and fixed:** during the first verification round, a `cd` into the scratchpad silently failed and `npm install playwright` ran against the project's actual `package.json` instead, adding it as a dependency and polluting the manifest with stray `npm init` fields (`description`, `main`, `directories`). Caught immediately via `git status`/`git diff` before anything else happened; reverted with `git checkout -- package.json package-lock.json` and removed the stray `node_modules/playwright*`. No trace of it made it into any commit.

**Also hit and fixed, unrelated to the code change:** Turbopack's persistent build cache panicked (`turbo-persistence` slice-range error) after a dev server was force-killed mid-run during testing — cleared `.next` and restarted, which resolved it. Not a HeroCanvas bug, but worth knowing if it recurs: force-killing `next dev` can corrupt the Turbopack cache.

Files changed: `components/HeroCanvas.tsx` only, across all four passes.
