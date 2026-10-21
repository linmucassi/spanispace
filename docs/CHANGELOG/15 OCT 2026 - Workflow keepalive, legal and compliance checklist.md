# 15 Oct 2026 — Workflow keepalive, legal and compliance checklist

## Scheduled workflows about to be auto-disabled

GitHub emailed that "Daily Scraper" and "Email Notifications" would be disabled soon. GitHub turns off scheduled workflows in public repos after 60 days with no repository activity. The last push was 23 Aug 2026, which puts the cutoff around 22 Oct 2026.

Added `.github/workflows/keepalive.yml`. It runs monthly (1st, 06:00 UTC) and can also be started by hand. It calls `gh workflow enable` on `daily-scraper.yml`, `notifications.yml` and itself, using `GITHUB_TOKEN` with `actions: write`. Re-enabling through the API resets the inactivity timer, so the scraper and notification crons keep running through quiet stretches without anyone needing to push. It needs to be on `staging` (the default branch) before 22 Oct to take effect.

## Legal & compliance checklist

Linda supplied a 20-item checklist (privacy/terms/refund/cookie policies, consent, data minimisation, third-party SDKs, dark patterns, hidden fees, fake reviews, unsupported claims, alt text, contrast, keyboard nav, business details, children's data, unsubscribe links, font/image licensing, data deletion). Each item was checked against the code and recorded with a status in the new **Legal & Compliance Checklist** section of `docs/ROADMAP.md`.

Main gaps found (none fixed yet):
- `components/Hero.tsx` advertises "2,400+ Verified Jobs" against ~338 rows in `jobs`, most of them scraped and unverified.
- Signup has no Terms/Privacy consent and no age check. The footer newsletter has no marketing opt-in wording.
- The privacy policy promises deletion, but the app has no account-deletion flow.
- Outbound email has no unsubscribe link or `List-Unsubscribe` header.
- The footer has no ECT Act s43 business details, and the "About us"/"Partnerships" links are dead.
- There's no written refund policy, even though paid training levels exist.

Also corrected in the roadmap: PR #10 was merged on 11 Aug 2026, but the roadmap still described it as open. The "What's Built" Legal row moved from ✅ to 🟡 and now links to the checklist. The scraper row and Phase 1 email-notifications note now mention the keepalive workflow and checklist item #18.

## All outstanding production migrations confirmed run

Linda confirmed that every SQL file in the roadmap's "Outstanding: Production Migrations" list has been run against production. That covers the 22 Aug signup fix (`fix-candidate-signup-search-path.sql`), `fix-security-hardening.sql` (issue #8), `fix-cv-completeness.sql`, the 22 Aug feature migrations (application journeys, talent sourcing and verification, roles, invites and calendar) and everything from the July and August lists. In `docs/ROADMAP.md`, every "migration pending", "needs deploy" or "unverified" row in What's Built is now ✅ Live, and the Google OAuth row is no longer 🔴. The Outstanding Migrations section has a "cleared" banner, and the issue #8 checkbox is ticked.

Still to confirm: the issue #8 admin-audit and demotion step, the super_admin bootstrap `UPDATE` (otherwise `/admin/users` and admin invites don't work), and the post-migration smoke test.

## Email delivery and DNS audit (issues #9, #11)

Netlify was connected to Claude Code via MCP, and live DNS was queried.
- **Transactional email has never sent in production.** `RESEND_API_KEY` and `EMAIL_FROM` aren't set on the Netlify site (`soft-dango-fd7dc2`). `lib/email.ts` treats missing vars as "not configured" and skips sending without an error, so application notices, notification digests and the 10 Sep welcome email have all been no-ops. In the roadmap, the Email notifications row is downgraded to 🔴.
- **DNS** is on Netlify DNS. Zoho MX and SPF are in place. There's no DMARC, no Resend records and no Zoho DKIM.
- **Plan change for issue #9:** Supabase auth SMTP will go through Resend (`smtp.resend.com`, username `resend`), not Zoho. Resend needs setting up anyway, and this avoids the Zoho app password and plan limits. The DMARC record will start at `p=none` rather than the `p=quarantine` in issue #11, so mail that isn't authenticated yet doesn't land in spam.
- **Security:** `SUPABASE_SERVICE_ROLE_KEY` was stored in Netlify as a non-secret, so it was readable in plain text by anyone on the team. Linda is marking it secret. The agent's attempt to do so was blocked by Claude Code's safety rules on secret writes, so secrets stay a manual step.

Full step-by-step plans are under Issues #9 and #11 in `docs/ROADMAP.md`.

## Files changed
- `.github/workflows/keepalive.yml` (new)
- `docs/ROADMAP.md`
