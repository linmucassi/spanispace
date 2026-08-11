# 11 Aug 2026

## New course: Engineering Mentorship Program
Added a new SpaniSpace Academy course, `/training/engineering-mentorship`, transcribed from a supplied 12-week DevSecOps-first mentoring framework (mandatory engineering standards, 5 phases, 4 project portfolios — RSVP platform, Sunday School multi-tenant system, an AI code review bot and an incident/status page system as capstone choices — and a career-engineering final week). Structured into 6 lessons in `data/academy.ts` (`academy.mentorship`), registered the same way as the two existing courses in `data/courses.ts` (`COURSES`) and `data/constants.ts` (`TRAININGS`). No page changes needed — the course/lesson routes and sitemap all derive from `COURSES`.

**Follow-up same day:** user asked for a recurring requirement across every project — a public GitHub push, a LinkedIn post, and a mention on another platform, tied to interview/recognition chances. Added as a fifth named standard ("Ship publicly, every time") in lesson 1's standards list and outcomes, plus a `Before you call Project N done` closing paragraph and an extended `activityHtml` completion line on each project lesson (3, 4, 5 — the RSVP platform, the Sunday School system, and the capstone). Lesson 6 (career engineering) already covered GitHub/LinkedIn positioning in depth as the week-12 wrap-up and was left as-is.

**Second follow-up, same day:** mentorship lesson titles read as one cluttered sentence — "Weeks 4 to 6, Project 1, the personalization and events engine." User asked to separate the timeline from the heading. Added an optional `eyebrow` field to `AcademyModule` (`data/academy.ts`) so a lesson can carry a short timeline label apart from its title; every mentorship lesson now has one ("Before Week 1", "Weeks 1-3", ... "Week 12") and the corresponding `title` was trimmed down to just the heading. Rendered as a small brand-colored mono label above the title on the course page's lesson-list cards, and inline next to the lesson number on the lesson detail page header (`01 · Weeks 1-3`). Optional field, so the two existing courses (no week ranges) render unchanged.

## Training content gated behind login, lesson progress added
User report: `/training/[course]/[lesson]` had no auth check anywhere — full lesson content (`bodyHtml`, `keyTerms`, `activityHtml`) was readable by anyone, logged in or not. Wanted: public visitors see course-level teaser info only, full lessons and the ability to progress through them require signing in, with completion kept against the account.

- New table `academy_lesson_progress` (`supabase/add-academy-progress.sql`), keyed on `auth.uid()` directly rather than `candidate_profiles.id` — the gate is "signed in", not "is a candidate", so a company or admin account can read and complete lessons too. RLS: a user can only read/write their own rows.
- New route `POST /api/academy-progress` — validates `courseSlug`/`lessonNumber` against the real course registry (`data/courses.ts`) before writing, so the endpoint can't be used to insert an arbitrary row; upserts or deletes a completion row for the caller.
- `app/(public)/training/[course]/[lesson]/page.tsx`: now reads the session server-side (`createServerSupabase`). Signed out, the page still shows title/hook/outcomes (unchanged teaser) but replaces body/key-terms/activity/closing/prev-next-nav with a locked panel linking to `/login` and `/register`. Signed in, unchanged behaviour plus a new `LessonCompleteButton` (`components/training/LessonCompleteButton.tsx`) that toggles completion.
- `app/(public)/training/[course]/page.tsx`: same session check. Signed out, the "Start" CTA becomes "Sign in to start this course"; the lesson list itself is unchanged (already just a teaser — titles + one-line hooks, no body content, so nothing further to hide there). Signed in, shows a completed-lesson count and a "Done" badge per finished lesson.
- `app/candidate/dashboard/page.tsx`: new "Training Progress" card, one progress bar per course with any completed lessons, resolved against `COURSES` for title/total. Hidden entirely when there's no progress to show.
- New `course.*` i18n keys in both `lib/i18n/en.ts` and `lib/i18n/zu.ts` for the locked-panel copy, sign-in CTA, and progress/complete-button labels.

**Side effect, expected and load-bearing:** reading the session via `cookies()` forces `/training/[course]` and `/training/[course]/[lesson]` to render dynamically per-request instead of at build time — confirmed in the `npm run build` output, both routes flipped from `○` (static) to `ƒ` (dynamic). Without that, the auth check would run once at build time against no session and either lock out everyone or bake full content into a public static shell regardless of who requests it.

## Files changed
```
M  app/(public)/training/[course]/page.tsx
M  app/(public)/training/[course]/[lesson]/page.tsx
M  app/candidate/dashboard/page.tsx
M  data/academy.ts
M  data/constants.ts
M  data/courses.ts
M  docs/ROADMAP.md
M  lib/i18n/en.ts
M  lib/i18n/zu.ts
A  app/api/academy-progress/route.ts
A  components/training/LessonCompleteButton.tsx
A  supabase/add-academy-progress.sql
```
`npm run build` passes clean (89 routes; `/training/[course]` and `/training/[course]/[lesson]` now listed as dynamic (`ƒ`) rather than static (`○`), as expected). Rebuilt clean again after both same-day follow-ups (the ship-publicly copy and the eyebrow/title split).

## Still outstanding
- `supabase/add-academy-progress.sql` needs to be run against the live Supabase project (`rssuacaedvihhpcakuvm`) before the "mark complete" button or the dashboard progress card do anything but silently no-op — see item 16 in `docs/ROADMAP.md#outstanding-production-migrations`.
- `/login` ignores any `?next=` parameter and always redirects by role (`/candidate/dashboard`, etc. — see `app/(auth)/login/page.tsx`), a pre-existing limitation shared with every other gated route in the app (middleware sets `?next=` the same way). Signing in from a locked lesson page does not return the reader to that lesson; they land on their dashboard instead. Not fixed here — it's a broader, pre-existing gap, not something specific to training.
- New mentorship course lesson content is English-only, matching the existing (undocumented-as-a-decision) state of `data/academy.ts` for the other two courses.

---

## Content trim + card cleanup, all three courses (later same day)
User asked to go through every course and cut wordiness while keeping detail, and to uniformly apply the eyebrow/title decluttering to the rest of the training UI, keeping the existing design system rather than redesigning.

**Content.** Condensed all 23 lessons in `data/academy.ts` — all 12 `bootcamp` modules, all 5 `shortcourse` modules, and a lighter pass over the 6 `mentorship` modules added earlier today (already fairly tight from being freshly written). Typical `bodyHtml` cut from 5 paragraphs to 3–4, roughly a third shorter per lesson. Rule followed throughout: cut throat-clearing openers, restated "so what" summary sentences, and redundant framing; never touch a named company, tool, number, date, source URL, or the "verified July 2026" caveat lines — every fact, example and citation (Capitec, Takealot, Discovery, OfferZen, POPIA, the Anthropic J-Space research link, etc.) survives intact, only the sentences carrying it got tighter. `outcomes`, `keyTerms`, and `activityHtml` were left alone (already terse) except for the small `activityHtml` additions already made earlier today for the ship-publicly requirement. Guide/reference content (`tracksIntroHtml`, the `spine` intros/closing) was deliberately left untouched — out of scope, and it lives behind an opt-in "about" expander rather than in the main reading flow.

**UI, applied uniformly across all three courses' shared templates** (`app/(public)/training/[course]/page.tsx`, `[lesson]/page.tsx`, `components/TrainingSection.tsx` — one template renders every course, so a fix here is automatically a fix everywhere):
- `line-clamp-2` added to the lesson-list hook text on the course page, the catalogue card description, and the guide-card blurb, so a longer line can never stretch one card taller than its neighbours — a card-grid consistency issue the shorter copy from this pass makes far less likely to trigger, but worth guarding against permanently rather than depending on every future edit staying short.
- Confirmed the `eyebrow` field added earlier today (mentorship's "Weeks 1-3" labels) already declutters uniformly by construction — it's optional per lesson and rendered by the one shared template, so `ai-foundations` and `ai-careers-bootcamp` (no eyebrow data) render exactly as before, no separate change needed there.

No layout, spacing, or color changes — same design system, tighter copy inside it.

## Files changed, this pass
```
M  app/(public)/training/[course]/page.tsx
M  components/TrainingSection.tsx
M  data/academy.ts
```
`npm run build` and `npm run lint` both clean (same 41 pre-existing lint problems as every prior pass today, none in touched files).

## Still outstanding, this pass
- Guide/reference pages (`career-tracks`, `salaries`, `certifications`, `case-studies`, `resources`) and the `spine` intro/closing text were not condensed — same "out of scope, separate future decision" status as their English-only translation state already noted above.

---

## Compulsory phone/name on signup, forced profile completion after Google (later same day)
User report: some candidates end up with no display name or phone number. Wanted phone made compulsory at signup, and — specifically for "Continue with Google" — a forced step after a successful sign-in to add a phone number and confirm/update the display name Google provided, before the candidate can proceed anywhere else.

Researched first (`handle_new_user()` trigger in `supabase/fix-security-hardening.sql:46-82`, `candidate_profiles` schema, the register form, the OAuth callback, and `lib/supabase/middleware.ts`) before touching anything, since this is auth-adjacent. Key finding that shaped the design: `candidate_profiles.phone` **must stay nullable in the DB** — the trigger creates the `candidate_profiles` row automatically for every new auth user including Google sign-ins, and Google never supplies a phone, so a `NOT NULL` constraint there would break Google sign-up outright. Enforcement had to live at the application layer, not the schema. Also found the trigger already does `COALESCE(NULLIF(TRIM(full_name), ''), email-local-part)`, so Google's real name is already picked up automatically when Google supplies one — the new onboarding step still surfaces it as an editable field so the candidate explicitly confirms/corrects it, rather than that happening silently.

Asked one clarifying question before implementing: should the new hard gate also apply to existing candidates who already have no phone (since it was optional until now), or only to new signups going forward. User chose **everyone missing a phone** — simplest, and makes "compulsory" actually mean compulsory rather than grandfathering in a permanent exception.

- `app/(auth)/register/page.tsx` — candidate-tab phone `&lt;input&gt;` now has `required` (full name already did).
- New `app/candidate/onboarding/page.tsx` (client component, mirrors the load/save pattern already in `app/candidate/profile/page.tsx`) — pre-fills full name and phone from `candidate_profiles`, both required, saves via `.update(...).eq('user_id', user.id)` (existing `"Candidates update own profile"` RLS policy already allows this, no migration), then redirects to a same-origin-only `?next=` path or `/candidate/dashboard`.
- `lib/supabase/middleware.ts` — after the existing candidate-route role check passes, one additional query for `candidate_profiles.phone`; if missing, redirects to `/candidate/onboarding?next=<original path>` (skipped for the onboarding route itself, to avoid a redirect loop). Runs for every authenticated `/candidate/*` request, old accounts and new alike.
- New `onboarding.*` i18n keys in `lib/i18n/en.ts` and `lib/i18n/zu.ts`; field labels reuse the existing `auth.fullName`/`auth.phone` keys rather than duplicating them.
- Deliberately used `window.location.search` instead of Next's `useSearchParams()` hook to read the `next` param — avoids the Suspense-boundary requirement that hook otherwise imposes on a client page, no functional difference here.

**Out of scope, on purpose:** company signup (no phone/display-name concept there — companies have `company_name`, already required); any DB-level `NOT NULL` on `phone` (breaks Google sign-up, see above); public non-`/candidate` routes like applying for a job before ever visiting a dashboard (middleware has only ever covered `/admin`, `/candidate`, `/company`, extending that scope wasn't asked for).

## Files changed, this pass
```
M  app/(auth)/register/page.tsx
M  lib/supabase/middleware.ts
M  lib/i18n/en.ts
M  lib/i18n/zu.ts
A  app/candidate/onboarding/page.tsx
```
`npm run build` and `npm run lint` both clean (`/candidate/onboarding` compiles as a static client shell like `/candidate/profile`; same 41 pre-existing lint problems as every prior pass today, none in touched files).

## Still outstanding, this pass
- Not tested against a live Supabase project from here (no DB access) — the manual verification steps in the plan (fresh Google signup lands on onboarding; existing candidate with `phone IS NULL` gets redirected on next visit; submitting returns to the original destination) still need to be run by hand once deployed.
- Google OAuth itself is still not enabled in the Supabase dashboard (separate, earlier-reported blocker) — this pass makes the *post*-Google-signup flow correct, but signing in with Google at all is still blocked until that's turned on.

---

## Also confirmed: display name was already required (later same day)
User asked whether display name was also compulsory on signup. It already was — `app/(auth)/register/page.tsx`'s full name field has always had `required`, and the onboarding page built earlier today also has `required` on its name field. No change needed, just confirmed by reading both files.

## "Fill from my CV" profile autofill (later same day)
User's actual ask was to let candidates populate their profile by "connecting/pulling from LinkedIn." Flagged a real constraint before writing any code: LinkedIn's self-serve OAuth ("Sign In with LinkedIn using OpenID Connect") only returns name, email and a profile photo — work history, headline and skills require LinkedIn's Partner Program, a manual approval process on LinkedIn's side, not something achievable by writing code. Asked the user to choose between basic-connect-only, waiting on Partner Program approval, or a manual "paste your LinkedIn URL" field. The user redirected instead: does CV upload already populate the profile? It didn't — `/candidate/cv-audit` is advisory only and explicitly never stores or writes back (per its own on-page disclaimer). Agreed replacement: Claude-powered CV parsing into a review-then-confirm form, available from both the onboarding step and the full profile page. Asked two follow-up scoping questions (entry points: both; CV source: file upload) before implementing.

Researched first (`package.json` for any PDF/DOCX parsing library — none; `components/candidate/DocumentLibrary.tsx`'s exact upload/storage-path pattern; `WorkExperience.tsx`'s insert shape and `WORK_TYPE_LABELS`; both existing Claude routes' conventions) to reuse existing patterns rather than inventing new ones. Key decision: **PDF only for v1** — the repo has no PDF/DOCX text-extraction library, and legacy `.doc` parsing has no good library at all. Claude's Messages API accepts a PDF directly as a native `document` content block, so this needed **zero new npm dependencies** — the Anthropic SDK is already a dependency (`app/api/cv-audit`, `app/api/profile-summary`). DOCX/DOC still upload fine through the existing document library for storage, just not through this new autofill path.

- New `app/api/cv-extract/route.ts` — auth-gated (`createServerSupabase` + `getUser`, matching every other API route in this app), loads a `candidate_documents` row through the RLS-scoped client (no separate ownership check needed — a row belonging to someone else simply doesn't come back, same trust boundary `app/api/applications/route.ts` already documents), rejects non-PDF with a clear message, fetches the file from the public `documents` bucket, base64-encodes it, and sends it to `claude-opus-4-8` as a `document` content block with an extraction prompt instructing it to never invent a name/employer/date/skill not actually present. Same JSON-extraction convention as the existing two Claude routes (regex + `JSON.parse` in try/catch), plus the `stop_reason === 'max_tokens'` guard copied from `profile-summary`. Its own rate limiter (5/hour/user, tighter than `cv-audit`'s 8/hour, since this call also attaches a full file). **Never writes to any table** — returns parsed JSON only.
- New `components/candidate/CvAutofill.tsx` — self-contained like `DocumentLibrary.tsx`: collapsed behind a "Fill from my CV" button, uploads through the exact same storage path/bucket convention as `DocumentLibrary` (so the CV also shows up in the candidate's document library for free), calls the new endpoint, then renders the extracted fields as an **editable review form** — full name, phone, location, skills, summary, and each work-experience entry (editable/removable, using the existing `WORK_TYPE_LABELS`). Nothing is saved until the candidate clicks "Use these details," which fires an `onExtracted(result)` callback and nothing else — the component never talks to `candidate_profiles` or `work_experiences` directly, since onboarding and the full profile page need different handling of the result.
- `app/candidate/onboarding/page.tsx` — renders `CvAutofill` above the existing name/phone form; the callback only pulls `full_name`/`phone` into the already-required fields, keeping the compulsory gate narrow and fast rather than turning it into a big form.
- `app/candidate/profile/page.tsx` — renders `CvAutofill` near the top; the callback merges non-empty extracted fields into the existing `profile` state (skills union rather than replace, so existing skills survive), inserts any extracted work-experience entries directly into `work_experiences` (same insert shape `WorkExperience.tsx` itself uses), then bumps a new `workRefreshKey` state used as that component's React `key` to force it to remount and reload from the DB — reused the existing component as-is rather than adding it a new prop for external inserts. The candidate's own existing "Save Profile" button is still what persists the profile fields; only the work-experience rows save immediately (matching how `WorkExperience.tsx` has always saved its own entries immediately, independent of the page's Save button).

**Out of scope / flagged, on purpose:** DOCX/DOC extraction (no library, no partner-restricted API); the DB-level assumption that a PDF-plus-`thinking` Claude call is heavier than the already-live `cv-audit` call — no Netlify/Next config in this repo currently overrides any timeout or payload limit for any route, so this is worth watching in production rather than something to preemptively configure blind.

## Files changed, this pass
```
M  app/candidate/onboarding/page.tsx
M  app/candidate/profile/page.tsx
M  docs/ROADMAP.md
A  app/api/cv-extract/route.ts
A  components/candidate/CvAutofill.tsx
```
`npm run build` and `npm run lint` both clean (new `/api/cv-extract` route listed as dynamic; same 41 pre-existing lint problems as every other pass today, none in touched files).

## Still outstanding, this pass
- Not tested against a live Supabase project or the real Anthropic API from here — no DB/API access in this environment. Once deployed: upload a real PDF CV from both entry points, try a `.docx` to confirm the rejection message, and try a short/garbled PDF to confirm the JSON-parse failure path degrades gracefully.
- Production request duration for this endpoint (file fetch + base64 encode + a `thinking`-enabled Claude call attached to a multi-MB document) has not been measured against Netlify's actual function timeout for this project's plan — flagged as a risk in the plan, not yet verified either way.

---

## Profile upgrades: split social links, multi-institution education, avatar + preview (later same day)

Four asks in one message. The fourth ("why are jobs only from South Africa?") was answered directly, no code involved — it's intentional (the platform's mission is explicitly SA-focused, documented in this roadmap's own header) plus a volume effect (Adzuna, the SA-specific source, can pull ~2,600 rows per run across 26 queries vs. RemoteOK/Remotive's combined ~300; `lib/publicJobs.ts` sorts SA jobs first but never filters international ones out). The other three all touched `/candidate/profile`, researched together before planning.

**1. Split social links.** "Portfolio / LinkedIn / GitHub URL" was one input. Research surfaced 7 places `portfolio_url` touched (`types/database.ts`, `lib/profileCompleteness.ts`, the dashboard's select query, the `compute_profile_score` DB trigger, `scripts/run-profile-nudges.ts`, `CandidateSearch.tsx`) — every one updated to treat "any of the three filled" as satisfying that one checklist/scoring bucket, rather than duplicating the bucket three times. `supabase/add-candidate-social-links.sql` adds `linkedin_url`/`github_url` and redefines `compute_profile_score` with the widened rule. Bonus, low cost since the pattern already existed: `/api/cv-extract` and `CvAutofill`'s review form now also extract/collect LinkedIn and GitHub URLs from an uploaded CV.

**2. Multi-institution education.** Research showed `matric_grad_year`/`university` (flat columns) ripple almost nowhere — not in scoring, not in company search, not on the dashboard — unlike `portfolio_url`, so this was safe to convert cleanly. New `candidate_education` table (`supabase/add-candidate-education.sql`), same one-to-many shape `work_experiences` already established, and a new `components/candidate/Education.tsx` that's a near-structural-copy of `WorkExperience.tsx` (self-contained load/insert/delete, own `onChanged` callback). The migration backfills existing `university`/`matric_grad_year` values into the new table so nothing a candidate already entered quietly vanishes; the old columns stay in the schema, unreferenced by the app from here on — confirmed nothing else reads them before leaving them in place rather than risking a destructive drop.

**3. Avatar + bio + "preview my profile."** No avatar/photo concept existed anywhere in the repo (confirmed by search — every "avatar" in the UI was a letter-initial circle). `professional_summary` already existed and already functions as the bio (shown in the "Your Professional Profile" section), so no new bio field was needed. New `avatar_url` column and a new public `avatars` Storage bucket (`supabase/add-candidate-avatar.sql`, `supabase/create-avatar-bucket.sql`, mirroring `create-documents-bucket.sql`'s RLS conventions exactly, sized for images: 2 MB, `image/jpeg`/`png`/`webp`), plus a new `components/candidate/AvatarUpload.tsx` (controlled by the parent page, so it always shows the same `avatar_url` state the rest of that page's form has). Wired into `/candidate/profile` (editable) and `/candidate/dashboard`'s header (read-only, next to "Welcome back").

For "preview as others see it," found the *only* existing third-party view of a candidate is the modal in `app/company/candidates/CandidateSearch.tsx` — but it's gated by an RLS policy (`supabase/fix-security-hardening.sql`) that only lets a company see a candidate's profile **if that candidate has applied to one of their jobs**. A literal "reuse the exact company view" preview would therefore show nothing for anyone who hasn't applied anywhere yet — exactly the person most likely to want a preview before applying. Built a new route, `/candidate/profile/preview`, instead: a self-contained, read-only rendering of the candidate's own data (own profile + own education + own work experience, all reachable under their existing RLS access, no new policies needed), styled like a profile card. Not a live reuse of the company-side component — that was a deliberate scope decision stated up front in the plan, not something the user was asked about mid-build, since the technical reasoning (RLS makes the alternative broken for most first-time users) was decisive enough to just state and proceed.

**Out of scope, on purpose:** not updating what companies themselves see in `CandidateSearch.tsx` beyond the two extra link buttons (bio/education/avatar still invisible to companies — a separate, not-requested change); not dropping the old education columns; not building signed URLs for the new avatars bucket (matches the still-public `documents` bucket's current state).

## Files changed, this pass
```
M  app/api/cv-extract/route.ts
M  app/candidate/dashboard/page.tsx
M  app/candidate/profile/page.tsx
M  app/company/candidates/CandidateSearch.tsx
M  components/candidate/CvAutofill.tsx
M  docs/ROADMAP.md
M  lib/profileCompleteness.ts
M  scripts/run-profile-nudges.ts
M  types/database.ts
A  app/candidate/profile/preview/page.tsx
A  components/candidate/AvatarUpload.tsx
A  components/candidate/Education.tsx
A  supabase/add-candidate-avatar.sql
A  supabase/add-candidate-education.sql
A  supabase/add-candidate-social-links.sql
A  supabase/create-avatar-bucket.sql
```
`npm run build` and `npm run lint` both clean (`/candidate/profile/preview` compiles as a new dynamic route; same 41 pre-existing lint problems as every other pass today, none in touched or new files — confirmed by grepping the lint output for each new filename).

## Still outstanding, this pass
- None of the 4 new migrations have been run against the live Supabase project from here (no DB access in this environment) — see items 17-19 in `docs/ROADMAP.md#outstanding-production-migrations`. Until they run: saving LinkedIn/GitHub URLs or an avatar will error, education entries can't be added, and the preview page's education/social-link sections will simply stay empty rather than crash (all reads are `?? []`/optional-chained).
- Not tested against a live Supabase project from here — the manual verification steps in the plan (split fields save independently; multiple education entries persist and delete independently; a pre-existing `university` value appears as a backfilled entry; avatar shows on both pages; preview reflects saved data for a candidate who has never applied anywhere) still need to be run by hand once deployed.

---

## Onboarding save bug, First/Last name, Netlify build warnings (later same day)

Three unrelated reports in one message.

**Onboarding save error.** User hit "We could not save your details. Please try again." on `/candidate/onboarding`. Traced the exact string to a single usage, `onboarding.error`, only referenced in that page's `handleSubmit`. Root-caused by comparison: that page called `.update({ full_name, phone }).eq('user_id', user.id)` on `candidate_profiles`, while `app/candidate/profile/page.tsx`'s own save handler uses `.upsert(..., { onConflict: 'user_id' })` for a documented reason (robustness against a missing row). A plain `.update()` against a nonexistent row doesn't itself raise a PostgREST error (it just silently affects zero rows), so the exact trigger for the *visible* error couldn't be confirmed without production logs this session doesn't have access to — but `.update()` was clearly the wrong tool regardless, since it can silently no-op and leave a candidate stuck in an infinite onboarding-redirect loop with no explanation. Switched to the same upsert pattern already proven on the profile page, and appended the raw Postgres error message to the on-screen text so if this recurs, the actual cause is visible instead of a dead end.

**First Name / Last Name.** Split the single "Full Name" input into two, on the register form, `/candidate/onboarding`, and `/candidate/profile`. Scoped this deliberately to the UI layer: `candidate_profiles.full_name` stays one NOT NULL column, exactly as before. New `lib/name.ts` (`joinFullName`, `splitFullName`, split heuristically on the first space) joins the two inputs before every save and splits an existing value back apart for editing — including inside `CvAutofill`'s extraction flow on both pages, so a CV-derived name also lands correctly in the two fields. Chose this over an actual schema split (`first_name`/`last_name` columns) because `full_name` is read as a single display string in 7+ places (dashboard header, `CandidateSearch.tsx`, transactional emails, the new profile preview page) that would all need to change for no functional benefit over string concatenation — stated as a scoping decision rather than asked about, since the ripple-radius argument was decisive on its own.

**Netlify build warnings.** Two separate items from a deploy log:
- `⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.` — read Next.js 16's own source (`node_modules/next/dist/build/analysis/get-page-static-info.js`) rather than guessing at the new API, since getting a routing-layer rename wrong is a bad place to be wrong. Confirmed the new convention is a root `proxy.ts` (or `src/proxy.ts`) exporting a function named `proxy` (default export also accepted) instead of `middleware`, same `config.matcher` export, same `NextRequest`/`NextResponse` signature. Renamed `middleware.ts` → `proxy.ts`, renamed the exported function; `lib/supabase/middleware.ts` (the actual session-refresh logic it calls into) is untouched, its filename isn't part of Next's special-file convention. Verified by rebuilding — the deprecation warning is gone from the output, and the route legend still correctly shows the proxy/middleware line.
- `@netlify/plugin-nextjs@5.15.9: latest version is 5.15.13` — ran `npm install @netlify/plugin-nextjs@latest`, which bumped `package.json`'s range to `^5.15.13` and updated the lockfile.

## Files changed, this pass
```
M  app/(auth)/register/page.tsx
M  app/candidate/onboarding/page.tsx
M  app/candidate/profile/page.tsx
M  lib/i18n/en.ts
M  lib/i18n/zu.ts
M  package.json
M  package-lock.json
D  middleware.ts
A  proxy.ts
A  lib/name.ts
```
`npm run build` and `npm run lint` both clean — critically, the middleware-deprecation warning that appeared in every prior build this session is now absent. Same 41 pre-existing lint problems as every other pass today, none in touched files.

## Still outstanding, this pass
- The exact root cause of the onboarding save error was not confirmed against production logs (no access from here) — the upsert fix closes the most plausible failure mode (missing row) and is a strict improvement regardless, but if it recurs, the now-appended raw error message is what to read next.
- `splitFullName`'s first-space heuristic is wrong for some real names (double-barrelled surnames, single-word names, names with no space) — it's an editable starting point on load, not a guarantee, same tradeoff already accepted elsewhere in this codebase (e.g. `handle_new_user`'s email-prefix fallback).
