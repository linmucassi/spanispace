# 14 Nov 2026: Test admin, job approvals, GitHub issues

The admin password for testing was lost. Passwords are stored hashed, so the old one can't be recovered.

- Production has one admin login, `admin@spanispace.com` (`super_admin`, created 18 Jun). It was left unchanged.
- Added a separate test login, `test@admin.com`, password `123456`, role `admin`, joining the other test accounts from 20 Oct.
  - Created with the service-role auth admin API (`email_confirm: true`, so no verification email).
  - `handle_new_user()` only lets `company` through, so the row was created as `candidate`. The role was then set to `admin` with the service role.
  - Sign-in checked with the anon key: it works.
- Data only, no schema or code change. Delete it through the auth admin API before launch, along with the other test accounts.

## Bulk approval of pending jobs

Linda asked for every pending job in production to be approved.

- Signed in as `test@admin.com` and set `vetted_status = 'verified'` on all 349 pending jobs: 348 scraped and 1 posted by a company ("GQOM DJ"). This is the same update the admin Jobs page makes. It sends no emails. 0 jobs are now pending.
- `lock_vetted_status` only allows `is_admin()`, so the update went through an admin session, not the service role.
- Some of the approved rows are clearly junk or tests and are now public: `z` (×3), `lkjlkjxcv`, `Test` (×2), `Test Job`, `Mapping Test via Sandra`, `APPLY NOW Send Veritas your Resume DON'T CLOSE WEBSITE`, `Why do you want this new job`, `Earn more`, `Find a job 3rd comi`. Most scraped roles are outside South Africa.

## Open GitHub issues

All 9 open issues were read and triaged. #8, #9 and #11 need dashboard or DNS access, not code.

### #29: unable to send invite to candidate
- Reproduced in production with `test@company.com`. The screenshot is Test Company's "Junior Frontend Developer" job.
- Two separate causes:
  1. `CandidateSearch.tsx` never sends `company_id`. Open PR #30 (BrendonM96) fixes this.
  2. `add-roles-invites-and-calendar.sql` backfilled `company_members` owner rows once, on 22 Aug. Nothing has created them since, so any company created after that date fails `company_can_operate()`. In production that is only Test Company (created 20 Oct), but it would affect every new company signup.
- New `supabase/fix-company-owner-membership.sql` adds an `AFTER INSERT ON company_profiles` trigger and a backfill. Mirrored in `schema.sql`. **Needs running in the SQL Editor.**
- Test Company's owner row was added by hand with the service role, the same row the backfill creates.
- Verified: with the owner row, the PR #30 insert succeeds and the current code still fails. Tested by setting `test@candidate.com` to open-to-offers for the test, then the invite was deleted and the flag restored. For Percy (the candidate in the screenshot), every policy condition now checks true. That was checked read-only, so no real invite was sent.

### #26, #27: application and new-message emails not received
- Both are already built. `/api/applications` sends the confirmation, and `trg_notify_new_message` queues an email for each message, sent by the hourly `notifications.yml` job.
- The production outbox had 319 pending rows and none ever sent (oldest 14 Aug): 302 profile nudges, 6 digests, 5 new messages, 4 expiry alerts, 2 status updates. `RESEND_API_KEY` is empty in `.env.local` and missing from GitHub secrets, and per 15 Oct it isn't in Netlify either. The sender exits 0 when unconfigured, so the Actions runs look green.
- `scripts/run-notification-sender.ts` now marks pending rows older than 3 days `failed` ("expired: not sent within 3 days") before sending, so turning Resend on won't mail out the backlog.

### #28: no sign-in confirmation email
- New `signInAlertEmail` in `lib/email.ts` and `app/api/auth/sign-in-alert/route.ts`, called fire-and-forget after password login, admin login and Google sign-in.
- The email contains the time in SAST, the method, a rough device (for example "Chrome on Windows") and city/country from Netlify's `x-nf-geo`. The IP address is left out.
- The recipient comes from the verified session. Accounts under 10 minutes old are skipped, since they get the welcome or confirmation email instead. A repeat within 2 minutes is skipped, with the timestamp kept in `app_metadata`.
- Sends nothing until Resend is configured.

### #2: favicon
- The photo shows the Next.js default icon. `app/favicon.ico` (25,931 bytes, from the first commit) is output as the first `<link rel="icon">`, ahead of the Spanispace icons PR #10 added. Deleted.

### #1, #8, #9, #11
- #1: SA-first ordering in `lib/publicJobs.ts` is still in place.
- #8: the admin audit query result today is `admin@spanispace.com` (super_admin) and `test@admin.com` (created today), with no unexpected admins. Can be closed.
- #9 and #11: unchanged, waiting on Resend setup and DNS/POPIA registration.

`tsc --noEmit` passes. Not yet run in a browser.
