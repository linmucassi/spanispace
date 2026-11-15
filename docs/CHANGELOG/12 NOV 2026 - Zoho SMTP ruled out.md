# 12 Nov 2026: Zoho SMTP ruled out

We revisited the 10 Sep plan to send Supabase auth emails (signup confirmation and password reset) through Zoho SMTP.

- Zoho Mail → Settings → Mail Accounts on the spanispace account shows:
  - IMAP: "This feature is not available for your account"
  - SMTP and Forwards: "available exclusively with the paid plans"
- The account is on Zoho's free plan, so Zoho has no SMTP relay that Supabase could use.
- **Outcome:** the 15 Oct plan stands. Issue #9 will be fixed with Resend, which will handle both Supabase auth SMTP and app email (`lib/email.ts`). The steps are under Issue #9 in `docs/ROADMAP.md`.
- Went through the Resend setup steps in the conversation; nothing is set up yet. Region: Ireland (eu-west-1). For Supabase SMTP, the username is the literal word `resend` and the password is a Resend API key. Resend has no separate SMTP password. Creating two keys, one for Netlify and one for Supabase, lets either be revoked without breaking the other.
- Zoho stays as the inbox for `info@` / `privacy@`. MX and SPF don't change. Zoho DKIM can still be turned on, because that works on the free plan as well.
