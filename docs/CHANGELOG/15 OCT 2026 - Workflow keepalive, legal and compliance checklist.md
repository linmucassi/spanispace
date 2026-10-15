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

## Files changed
- `.github/workflows/keepalive.yml` (new)
- `docs/ROADMAP.md`
