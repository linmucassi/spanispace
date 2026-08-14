# 14 Aug 2026

## Add: job title/keyword search on the public jobs board

User report: no way to search for a specific kind of job (e.g. "Pharmacy" / "pharmacist") on `/jobs` — only a job-type dropdown (Full-time, Remote, Learnership, etc.) and a South-Africa-only location toggle existed, neither of which filters by role.

Checked the `jobs` schema first in case "Pharmacy" should map to a category: there is no `category` column on `jobs`, only `job_type` (a fixed CHECK-constrained enum of employment arrangements). The `category` field that does exist in `types.ts` (`Bootcamp` / `Short Course` / `Event`) belongs to Trainings, unrelated to jobs. So free-text search against the job title was the only fit — not a new category to add.

Added a text input to `components/JobBoard.tsx`, alongside the existing two `<select>` filters. Filtering stays client-side (the board already receives the full page of jobs as `initialJobs` from `lib/publicJobs.ts`'s `fetchPublicJobs()` — no server-side query changes needed): case-insensitive substring match against `job.role` and `job.company`, combined with the existing type/location filters (all three now AND together), resets to page 1 on change like the other filters. New i18n key `jobs.searchPlaceholder` in both `lib/i18n/en.ts` and `lib/i18n/zu.ts`.

## Fix: dashboard sidebar logo invisible (dark logo on dark background)

User report: the logo in the dashboard sidebars looked wrong — dark logo on the dark sidebar background.

`components/candidate/CandidateSidebar.tsx`, `components/company/CompanySidebar.tsx`, and `components/admin/AdminSidebar.tsx` all render the sidebar on `bg-slate-900`. Each file's own mobile top bar, and `components/Footer.tsx`, already render `logo-wordmark.png` (a dark wordmark) as white via `brightness-0 invert` CSS filter classes — there's no separate white logo asset, just this filter. The desktop sidebar's logo (`h-10 w-auto`, no filter) was missing those two classes in all three sidebars, so it rendered dark-on-dark and was effectively invisible. Added `brightness-0 invert` to match the existing mobile/footer usage in all three files.

## Google sign-in was showing a raw Supabase domain, looked like phishing

Report (screenshot from Linda's phone): the Google sign-in consent screen read "Sign in to rssuacaedvihhpcakuvm.supabase.co" instead of anything mentioning Spani Space — easy for a real user to mistake for a scam.

Root cause: `signInWithOAuth({ provider: 'google' })` sends the browser to Google via a redirect through Supabase's own hosted endpoint (`https://<project-ref>.supabase.co/auth/v1/authorize` → `/auth/v1/callback`). Google's consent screen shows the domain of whatever redirect URI initiated the request — since that's Supabase's raw project subdomain, that's what the user saw, regardless of anything set in this app's own branding.

Two ways to fix it, discussed with the user first: pay for a Supabase custom auth domain (Pro plan, points `auth.spanispace.com` at Supabase so the redirect URI itself carries the brand), or rework the sign-in flow to run entirely on spanispace.com so no Supabase-hosted redirect happens at all. User chose the free rework.

**New flow: Google Identity Services (GIS) + `signInWithIdToken`, not `signInWithOAuth`.** Instead of redirecting to Google, the browser loads Google's own `accounts.google.com/gsi/client` script and renders Google's official "Continue with Google" button in place. Clicking it opens a Google-hosted popup that authenticates against *this page's origin* (spanispace.com), not a redirect URI — so it's the page origin Google displays, not any server-side callback domain. The button returns an ID token directly to the browser, which is handed to Supabase via `supabase.auth.signInWithIdToken({ provider: 'google', token, nonce })` to get a session — no redirect round trip through Supabase at all.

**New files:**
- `lib/auth/googleIdentity.ts` — loads the GIS script once (idempotent, handles concurrent callers), and a `generateNonce()` helper. The nonce matters: Google embeds a hash of it into the signed ID token, and Supabase re-hashes the raw value on exchange and rejects a mismatch — this is what stops a token captured elsewhere from being replayed against this app.
- `lib/auth/useGoogleSignIn.ts` — a hook that mounts Google's button into a container ref, wires the nonce + nonce hash through `initialize()`/`renderButton()`, and on the credential callback does the `signInWithIdToken` exchange and calls back with the resulting user id. Uses a **callback ref**, not a plain `useRef`, specifically because `/register`'s Google button unmounts/remounts when switching between the candidate and company tabs — a plain ref wouldn't have told the effect to re-render the button into the new DOM node on remount, so switching back to the candidate tab would have shown an empty container. Latest `onSignedIn`/`onError` callbacks are read through refs inside the GIS callback so the button doesn't need to be torn down and re-rendered on every parent re-render (e.g. every keystroke in the email field).
- `lib/auth/roleRedirect.ts` — `redirectToDashboard()`, the role lookup + route-by-role logic both the password-login path and the new Google path need. Previously this lived only inline in `handleLogin`; `/register`'s Google flow needs the same real lookup rather than assuming candidate, since an existing Google account clicked under the candidate tab could belong to someone who originally registered as a company.

**Changed:**
- `app/(auth)/login/page.tsx`, `app/(auth)/register/page.tsx` — `handleGoogleSignIn` (a `signInWithOAuth` call plus a manual redirect to `/callback`) replaced with `useGoogleSignIn`; the custom-styled Google button JSX replaced with a `<div ref={googleButtonRef} />` that Google's own script renders into. `handleLogin`'s inline role-switch now calls the shared `redirectToDashboard` instead of duplicating it.
- `next.config.ts` — CSP `connect-src` gained `https://accounts.google.com` (GIS's script talks to Google directly; the existing directive has no `default-src` fallback to lean on, so this needed to be explicit or the browser would have silently blocked every sign-in attempt).
- `.env.example` — new `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, documented as reusing the existing Google OAuth Client ID already wired into Supabase's Google provider, not a new client.
- `lib/i18n/en.ts`, `lib/i18n/zu.ts` — removed `auth.continueWithGoogle`. Google's own rendered button carries its own "Continue with Google" text now; the translated label was only ever used on the custom button this replaces.

**app/(auth)/callback/route.ts left untouched** — still needed for the email/password confirmation-link and password-reset flows (`emailRedirectTo`), which still route through a real server redirect. Google sign-in is the only path that no longer touches it.

**You still need to** (not achievable from code — see roadmap 1.3 for the full instructions): add `NEXT_PUBLIC_GOOGLE_CLIENT_ID` to Netlify's environment variables and `.env.local`, and in Google Cloud Console add `https://spanispace.com` (and `http://localhost:3000` for local testing) to that OAuth client's **Authorized JavaScript origins** — reuse the client already configured for Supabase, just add the origins, no new client needed and no change required on the Supabase Dashboard side. Until that's done the Google button won't render (`NEXT_PUBLIC_GOOGLE_CLIENT_ID` unset) and the page falls through to the email/password form with no error, same as when Supabase itself isn't configured.

Verified: `npx tsc --noEmit` and `npm run build` both pass clean.

## Email Notifications workflow failing every day

Report: "my Email Notifications workflows has been failing everyday." Rather than guess, pulled the actual run history and logs: `gh run list --workflow=notifications.yml --limit 100` (94 runs, ~9 days of history) then `gh run view <id> --log-failed` on the failing ones.

Every failure — 6 out of 6 — hit the same step, `Run expiry alerts (daily schedule only)`, with the same error: `Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add them to your environment.` The env block in the log literally showed both as blank (`SUPABASE_URL: `, `SUPABASE_SERVICE_ROLE_KEY: `) even though those are repo secrets referenced identically (`${{ secrets.SUPABASE_URL }}`) in every other step, all of which succeeded on every run. That ruled out an actual missing/rotated secret — if the secret itself were gone, the hourly-only steps using the same secret would fail too, and they never did (every single failure fell inside 05:00-07:40 UTC, every other hour of every day was clean).

Root cause: `notifications.yml` had three `schedule` triggers — hourly (`0 * * * *`), daily (`0 5 * * *`), weekly (`0 6 * * 1`). The hourly and daily crons fire at the exact same instant once a day (5:00 UTC). GitHub queues two separate runs of the same workflow back-to-back in that case, and the later-starting one (the daily-flagged run, delayed by GitHub's queue to somewhere between 05:00 and 07:40 depending on load) would intermittently come up with an empty secrets context — a known GitHub Actions flakiness pattern for workflows with colliding `schedule` triggers, not something wrong in this repo's own code or Supabase config.

Fixed by moving the daily/weekly crons off the top of the hour — `0 5 * * *` → `20 5 * * *`, `0 6 * * 1` → `20 6 * * 1` — so they never land on the same instant as the hourly trigger. The `if:` conditions gating the daily/weekly-only steps updated to match. `.github/workflows/notifications.yml` now documents the collision in a comment so a future edit to the schedule doesn't reintroduce it.

Likely how Linda found out day after day without checking the Actions tab herself: GitHub emails the repo owner automatically when a scheduled workflow run fails.

## Correction, same day: the cron-collision diagnosis above was wrong

Follow-up report: "my Daily Scraper workflow has been failing too." Pulled its run history the same way (`gh run list --workflow=daily-scraper.yml --limit 100`): **53 out of 53 runs had failed**, every single one since the scraper was added in June 2026 — not intermittent at all, which didn't fit the "occasional collision" story above. Its log showed the identical error, `Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY`, with the same blank env values.

That inconsistency (100% failure on one workflow, "6 failures out of ~94 runs" on the other, both hitting the identical error) meant the collision theory couldn't be right, and needed checking properly this time instead of pattern-matching off the notifications.yml timing alone: `gh secret list` — returned an **empty array**. Zero repository secrets exist in this repo. `gh api repos/linmucassi/spanispace/environments` turned up why it wasn't obvious from the GitHub UI: two **Environments** (a different GitHub feature — deployment protection rules, not Actions secrets) had been created named `SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL`, most likely by going to the wrong settings page (Environments instead of Secrets and variables → Actions). `${{ secrets.SUPABASE_URL }}` has never resolved to anything in this repo.

That fully explains both workflows without needing a "collision":
- `daily-scraper.yml`'s `run-scraper.ts` calls `getSupabaseAdmin()` unconditionally → fails every run, 100%, since June.
- `notifications.yml`'s hourly-only step (`run-notification-sender.ts`) checks `isEmailConfigured()` (`RESEND_API_KEY`/`EMAIL_FROM`) *first*, and those are also unset — including in `.env.local`, confirmed while fixing this, so email sending has never been wired up anywhere, not just in CI. It returns early before ever calling Supabase, logging `"RESEND_API_KEY/EMAIL_FROM not set — nothing to do"` and exiting 0. That's what made the hourly runs look like they were succeeding — they were succeeding at doing nothing. The daily-only steps (`run-expiry-alerts.ts`, `run-profile-nudges.ts`) have no such guard and failed **every time they ran**, which is once a day — the "6/6 failures" observed above, deterministic, not a race.

**Real fix:** checked `.env.local` for the actual values (read-only, values never echoed to any command output or this log), then pushed them as real GitHub repository secrets:
```
node -e "...extract SUPABASE_URL from .env.local..." | gh secret set SUPABASE_URL
node -e "...extract SUPABASE_SERVICE_ROLE_KEY from .env.local..." | gh secret set SUPABASE_SERVICE_ROLE_KEY
```
piped through stdin in both cases so the values never appeared in a command argument or terminal output. Confirmed with `gh secret list` (names + timestamps only). Then verified for real, not just assumed: `gh workflow run daily-scraper.yml --ref staging` and `gh workflow run notifications.yml --ref staging`, watched both with `gh run watch`. Both completed successfully, and this time the scraper's own log proved it wasn't a no-op: `[scraper] Done — 71 new jobs, 7 refreshed, 0 new events, 0 deleted, 0 errors` — its first real write to Supabase since the scraper was added in June.

The `:20`-past-the-hour cron offset from the fix above is harmless (still avoids a theoretical future collision) and was left in place, but it was never the actual fix.

**Still outstanding, not fixed here:** `RESEND_API_KEY`/`EMAIL_FROM` need a real Resend key added (both to `.env.local` for local testing and as GitHub secrets) before Email Notifications sends anything for real — the outbox will populate correctly now, but nothing will go out until that key exists. Also worth a look when convenient: the two stray `SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_URL` Environments in repo settings are harmless clutter (they don't grant access to anything) but are worth deleting so a future "add a secret" attempt doesn't land on them again by mistake.

## Custom 404 page: a Three.js astronaut waiting at a signpost

User asked for a proper 404 page (previously just a generic centered card with a big "404" and a "Back to Home" link — `app/not-found.tsx`, which is Next's catch-all for every unmatched route already, no routing change needed), inspired by an AI-generated reference image of an astronaut sitting at a bus-stop bench under a galaxy sky, with the bus stop sign changed to read "404."

**First pass, rejected as "ugly":** built the scene as a flat inline SVG illustration (hand-drawn signpost/bench/astronaut shapes) plus a CSS starfield, matching the app's existing brand tokens (`ink-950`/`ink-900` navy, `--color-work-piece` amber for the rusty post). User's response: "the page you created is ugly, can you use 3Djs" — this app already has a Three.js particle scene on the homepage hero (`components/HeroCanvas.tsx`), so a flat SVG read as a step down from the site's own bar, not up to it.

**Rebuilt as an actual Three.js scene**, new `components/NotFoundScene.tsx`, following the same container/canvas/mouse-parallax pattern `HeroCanvas.tsx` already established (`absolute inset-0` div, transparent `WebGLRenderer`, damped mouse-follow camera drift, `prefers-reduced-motion` renders one static frame instead of starting the animation loop): a signpost with a canvas-texture "404" sign and a flickering lamp, a wooden bench, an astronaut built from primitives (capsule torso and limbs, sphere helmet and visor, box backpack and boots — `makeLimb()` aligns a `CapsuleGeometry` between two points via quaternion instead of hand-rotating each segment), a distant planet and moon, a nebula wash and nearly-logarithmic-spiral-adjacent star glow baked to a canvas texture, and a twinkling starfield (shader `Points`, per-vertex phase, no boids simulation needed since this scene is meant to feel still rather than traveling).

**Two real bugs found only by actually looking at it, not by reading the code:**
1. The astronaut and signpost rendered as near-black silhouettes. Root cause: `MeshStandardMaterial` has no brightness of its own — it only shows whatever light reaches it — and the lamp's `PointLight` falloff plus a dim ambient light left most of the foreground group underlit. Fixed with a brighter ambient, a `DirectionalLight` acting as broad "starlight" fill (the standard three-point-lighting fix for anything a single point light's falloff doesn't reliably reach), and roughly doubled lamp intensity.
2. The "404" heading/message/button, laid out as a vertically-centered flex child with `padding-top` to push it below the scene, barely moved when the padding was increased — a centered flex child that grows taller from its own padding gets *re-centered* around that new height, so only about half of any padding increase actually shows up as visible offset. Switched to `absolute inset-x-0 bottom-*`, anchored to a fixed distance from the viewport bottom instead, which isn't subject to that recentering.

**Verification, not just code review:** installed Playwright's Chromium (`npx playwright install chromium`) and used its built-in `npx playwright screenshot` CLI command against the running dev server to actually look at the result at both a 1280×900 desktop size and a 390×844 mobile size, catching both bugs above and a third: on narrow mobile aspect ratios the sign clipped off the left edge of frame, because `PerspectiveCamera`'s `fov` is the *vertical* field of view in three.js and stays fixed regardless of aspect ratio, so a narrow/tall viewport gets a narrower horizontal slice, not a repositioned one. Fixed by pulling the camera back along its own line of sight (not just widening the frustum) proportionally as aspect ratio narrows below 0.75, recomputed on resize.

`app/globals.css`'s `@keyframes twinkle` (written for the SVG pass's CSS-animated stars) removed as dead code once the starfield moved into the Three.js shader.

## Files changed
```
A  components/NotFoundScene.tsx
A  lib/auth/googleIdentity.ts
A  lib/auth/roleRedirect.ts
A  lib/auth/useGoogleSignIn.ts
M  .env.example
M  .github/workflows/notifications.yml
M  app/(auth)/login/page.tsx
M  app/(auth)/register/page.tsx
M  app/globals.css
M  app/not-found.tsx
M  components/JobBoard.tsx
M  components/admin/AdminSidebar.tsx
M  components/candidate/CandidateSidebar.tsx
M  components/company/CompanySidebar.tsx
M  docs/ROADMAP.md
M  lib/i18n/en.ts
M  lib/i18n/zu.ts
M  next.config.ts
```
