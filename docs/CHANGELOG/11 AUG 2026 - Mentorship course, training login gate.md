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
