# 10 September 2026 — Auth email sender, Google signup welcome email

## Signup verification emails to send as info@spanispace.com

The domain's mail is on Zoho, and signup verification should come from
`info@spanispace.com` rather than Supabase's default `noreply@mail.app.supabase.io`.

Nothing in the repo sends those emails. Supabase Auth (GoTrue) generates them
itself, and the sender is whatever SMTP the project has configured — `lib/email.ts`
is Resend and only handles application confirmations, status updates, message
notifications, expiry alerts, digests and profile nudges. So this is a dashboard
change on project `rssuacaedvihhpcakuvm`, not a code change.

Recorded the full settings against **Issue #9** in `docs/ROADMAP.md` (which already
tracked "confirmation emails never arrive" and had previously assumed Resend):
Zoho host, port, app-specific password requirement, plus three things easy to miss
in the same visit — the separate 30/hour email rate limit that survives enabling
custom SMTP, the URL Configuration allow-list that silently voids the
`emailRedirectTo` `app/(auth)/register/page.tsx` already sends, and the fact that
`EMAIL_FROM` is `apply@spanispace.com` so the product will have two sender
addresses until someone decides which is the face of it. Left that alone
deliberately — it is a branding call.

Also flagged that Zoho Mail is a mailbox service rather than a transactional
relay, with a per-day recipient cap that burst signup traffic can trip, and that
ZeptoMail is Zoho's own answer if signups outgrow it.

Rewrote the transactional-email block in `.env.example` and `.env.local` so the
next person reading it doesn't look for a sender env var that doesn't exist.

## Google signups were silent — welcome email added

Reported as "no verification email is received when signing up with Google". That
turned out to be correct behaviour rather than a fault: `lib/auth/useGoogleSignIn.ts`
uses `signInWithIdToken`, Supabase trusts the `email_verified` claim inside Google's
ID token, and the account is therefore created **already confirmed**. There is
nothing left to verify, so GoTrue never generates a confirmation email — which is
also why the flow drops straight to the dashboard instead of the "check your email"
state the password path shows when `data.session` is null.

The real gap was that a Google signup produced no acknowledgement at all, while a
password signup at least got Supabase's confirmation mail. Added one:

- **`lib/email.ts`** — `welcomeEmail({ firstName, role })`, built on the existing
  `wrapEmail` shell so it matches the other six templates. Copy and CTA differ for
  candidate (finish your profile) vs company (post your first listing).
- **`app/api/auth/welcome/route.ts`** — new. Takes no body: the recipient comes from
  `getUser()` on the verified session, never from the client. Two guards keep it to
  genuinely new accounts, since the browser can't tell a Google signup from a Google
  sign-in and calls this on both:
  1. `created_at` must be within 10 minutes. Without it, every Google user who
     signed up before this route existed would be welcomed on their next sign-in.
  2. `app_metadata.welcome_email_sent_at` must be unset. `app_metadata` rather than
     `user_metadata` because the latter is writable with the user's own access
     token — they could clear the flag and re-trigger the send.

  The flag is claimed *before* the send so two tabs finishing sign-in together
  can't both mail the person, and rolled back if the send fails so the next
  sign-in inside the window retries. No migration needed — the flag lives in
  `auth.users`, written with the service-role client.
- **`lib/auth/useGoogleSignIn.ts`** — fires the request `keepalive` and unawaited, so
  it survives the redirect and never delays or blocks sign-in. Nothing about account
  access depends on it.

Considered and rejected: forcing Google signups through an email confirmation step.
It would mean rejecting an address Google has already verified, and adds a step that
costs signups for no security gain.

Typecheck clean (`npx tsc --noEmit`).

## Files changed
```
A  app/api/auth/welcome/route.ts
M  .env.example
M  docs/ROADMAP.md
M  lib/auth/useGoogleSignIn.ts
M  lib/email.ts
```
(`.env.local` gets the same doc comment as `.env.example` but is gitignored, so it doesn't show here.)
