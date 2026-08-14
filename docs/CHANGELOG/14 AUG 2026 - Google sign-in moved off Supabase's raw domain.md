# 14 Aug 2026

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

## Files changed
```
A  docs/CHANGELOG/14 AUG 2026 - Google sign-in moved off Supabase's raw domain.md
A  lib/auth/googleIdentity.ts
A  lib/auth/roleRedirect.ts
A  lib/auth/useGoogleSignIn.ts
M  .env.example
M  app/(auth)/login/page.tsx
M  app/(auth)/register/page.tsx
M  docs/ROADMAP.md
M  lib/i18n/en.ts
M  lib/i18n/zu.ts
M  next.config.ts
```
