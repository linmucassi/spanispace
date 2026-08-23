# 23 Aug 2026

## Fix: slow page navigation across the site

Linda reported navigation between pages was noticeably slow, not an internet issue (fast on other sites). Separately asked whether the Röhlig-Grindrod YES Programme learnerships added yesterday were actually live — confirmed they are: queried the live `jobs` table directly, all 5 province rows still exist, `vetted_status: 'verified'`, `status: 'active'`, none expired (earliest, Sandton, closes 26 Aug), `origin`/`apply_mode` correctly set from yesterday's fix-up. The data was never the problem, which pointed straight at the same root cause as the slowness report: pages not finishing loading in reasonable time.

Investigated rather than guessed. First hypothesis — that yesterday's several rounds of *additive* RLS policies (opted-in candidates, company org/RBAC, interview scheduling, all layered on top of existing policies rather than replacing them) were making every query evaluate a stack of `SECURITY DEFINER` policy functions per row — turned out **not** to be the cause: timed the public `/jobs` query (326 rows) as anon-with-RLS vs. service-role-with-RLS-bypassed directly against the live project, and they came back within noise of each other (~250-300ms both, after a ~1s cold-start on the first call of either). Good that this got measured instead of assumed — it would have been the wrong fix.

The real cause was much more mundane and entirely self-inflicted: yesterday's feature work added several **sequential, un-batched Supabase queries** to already-chatty dashboard pages. `app/candidate/dashboard/page.tsx` had grown to 8+ `await`s in a row (profile, CV count, application count, shortlisted count, recent applications, verification-pending count, pending-invites count, enrollments count, academy progress) — each a separate network round trip, each measured at roughly 150-300ms against the live project, executed one after another instead of together. At minimum two of those (verification status, pending invites) were added yesterday specifically. Sum instead of max: a page that could load in ~300ms was taking 1.5-2.5 seconds, on every single visit to the candidate dashboard — one of the two most-visited pages in the app right after login.

**Fixed:**
- `app/candidate/dashboard/page.tsx` — the 8 independent queries (only depending on `user.id`/`candidateId`, both known up front) now fire together via `Promise.all` instead of one after another.
- `app/company/candidates/page.tsx` — had the same problem, also partly introduced yesterday (the applicant-vs-opted-in badge and sent-invites lookups): fetched the company's jobs *twice* (once active-only for the invite picker, once unfiltered for the applicant-matching check) as two separate sequential queries. Now fetched once and the active-only list is derived from it in memory; the three independent lead queries (candidates, jobs, sent invites) run via `Promise.all`, and the two queries that depend on those results (applications-by-job, CVs-by-candidate) run in a second `Promise.all` batch instead of sequentially.
- `lib/company/resolveCompanyMembership.ts` now also returns `company_name` (a plain column already on the row/join it queries, no extra cost) so callers don't need a second round trip just to get the name back. `app/company/dashboard/page.tsx` had picked up exactly that redundant second query yesterday when it was repointed at this helper — removed, back to one round trip for the common case (an existing company owner), same as before yesterday's change.

**Not the cause, left alone:** `lib/supabase/middleware.ts` already did 2-3 sequential round trips per protected-route navigation before yesterday (session refresh, role lookup, a phone-completeness check for candidates) — pre-existing architecture, not a regression, and the one query added to it yesterday (a `company_members` fallback lookup) only runs for the non-owner case, never for existing company logins. This is a real structural cost that exists on every navigation in the app regardless of today's fix, but changing it means changing how session/role state is read across the whole site — flagging it rather than touching it under this report.

**Verified:** `npx tsc --noEmit` and `npm run build` both clean. Did not re-time the live site end-to-end (would need a real authenticated session against production) — the fix is a straightforward reduction in round-trip count, verified by reading the resulting code path rather than by a live before/after timing.

## Files changed
```
M  app/candidate/dashboard/page.tsx
M  app/company/candidates/page.tsx
M  app/company/dashboard/page.tsx
M  app/company/profile/page.tsx
M  lib/company/resolveCompanyMembership.ts
```
