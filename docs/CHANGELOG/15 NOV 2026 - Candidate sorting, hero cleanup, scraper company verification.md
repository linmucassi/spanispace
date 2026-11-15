# 15 Nov 2026: Candidate sorting, hero cleanup, scraper company verification

Four requests from Linda, all built today.

## Sort buttons on Find Candidates (companies)

- `app/company/candidates/CandidateSearch.tsx` now has a "Sort by" row of pill buttons: **Best profile** (default, profile score), **Newest** (`created_at`), **Name A-Z**, **Verified first**, **Applicants first** (candidates who applied to this company's jobs).
- Sorting is client-side. The page already loads every candidate RLS lets the company see, so no new query. Ties fall back to profile score, then name, so the order is stable.
- Buttons use `aria-pressed` and wrap on phone widths.

## Landing hero: PieceJobs badge removed

- The floating "PieceJobs / Hire trusted local help" card in `components/Hero.tsx` was absolutely positioned (`-top-5 right-4`) over the live stats panel and covered it. Removed, along with the unused `Hammer` import and the `hero.pieceJobsHint` string in `lib/i18n/en.ts` and `zu.ts`.
- The navbar PieceJobs link and the PieceJobs section further down the home page are unchanged.

## Scraper: verify each company by its website, delete the ones that fail, auto-approve the rest

**New policy:** scraped jobs no longer wait in the admin review queue. A job goes live straight away if its company can be verified by its website. If the company can't be verified, the job is dropped, and any of that company's scraped jobs already in the database are deleted.

- New `lib/scrapers/company-verifier.ts`. None of the sources give a company website, only a name, so it guesses domains from the name: words joined (`coalitiontechnologies`), hyphenated, and the first word as a weaker fallback, across `.com .co.za .io .co .ai .ca .co.uk .com.au`. A domain counts if it serves HTML, isn't a parked or for-sale page, and mentions the company name. Big brands behind bot protection (a 401/403/429/503 on the exact-name `.com` or `.co.za`) also count. Results are cached per name, with 10 checks at a time and a 5 s timeout each.
- `lib/scrapers/db-writer.ts`:
  - `writeJobs()` keeps only jobs from verified companies and inserts them with `vetted_status = 'verified'` (previously `'pending'`). It returns an `unverified` count, which the run log prints.
  - New `reconcileScrapedJobs()` runs after every scrape over **all** `origin = 'scraped'` rows that are pending or verified. A verified company's pending rows are approved, and an unverified company's rows are deleted. Admin-rejected rows, admin-curated jobs and company-posted jobs are never touched.
- `.github/workflows/daily-scraper.yml` timeout raised from 15 to 30 minutes, since verification adds about 6–7 minutes.
- New `scripts/dry-run-company-verify.ts` is read-only and reports what reconcile would do.

**Dry run against production today (read-only):** 597 live scraped jobs from 471 companies. **417 would stay and 180 would be deleted.** The check took 391 s.
- Correctly kept, for example: Lemon.io, TELUS Digital, Toptal, FedEx, Four Seasons, H&M, Cotton On, Wipro, SLB.
- Deleted, for example: placeholders (`y`, `scvsdv`) and companies whose domain doesn't match their name (The Home Depot Canada, Hilton, Radisson Hotel Group, Canada Post, Walmart Canada, Royal Caribbean).
- Known false positives, where a generic name matched an unrelated site: `Stone` → stone.com, `Wood` → wood.com, `Hovis Ltd` → hovis.ai.
- ~~Every Adzuna job posted as "Employer on Adzuna" will be dropped~~. **Changed the same day (Linda's decision):** Adzuna listings with no employer name are kept and go live, or most South African jobs would disappear (issue #1). `ADZUNA_NO_NAME` in `company-verifier.ts` (also used by `sources/adzuna.ts`) counts as verified with no website. Adzuna jobs that *do* name a company still go through the website check.

**DB catch:** `lock_vetted_status()` silently keeps the old `vetted_status` on UPDATE unless `is_admin()`, and the service role has no `auth.uid()`. So the reconcile approvals would be quietly reverted. Inserts aren't affected (the trigger is `BEFORE UPDATE` only).
- New `supabase/allow-service-role-vetting.sql` adds a `service_role` pass. **Needs running in the SQL Editor.** The same change is mirrored in `fix-security-hardening.sql`, so re-running that file won't undo it.
- Until it runs, reconcile detects the revert and logs `N approvals reverted by lock_vetted_status`. Today it has nothing to approve anyway: 0 pending since the 14 Nov bulk approval.

`tsc --noEmit`, eslint on the changed files, and `npm run build` pass. The home page renders (200) without the badge. Not checked in a browser (the Chrome extension wasn't connected).

## Files changed

- `app/company/candidates/CandidateSearch.tsx`
- `components/Hero.tsx`
- `lib/i18n/en.ts`
- `lib/i18n/zu.ts`
- `lib/scrapers/company-verifier.ts` (new)
- `lib/scrapers/db-writer.ts`
- `lib/scrapers/orchestrator.ts`
- `lib/scrapers/sources/adzuna.ts`
- `scripts/dry-run-company-verify.ts` (new)
- `.github/workflows/daily-scraper.yml`
- `supabase/allow-service-role-vetting.sql` (new)
- `supabase/fix-security-hardening.sql`
- `docs/ROADMAP.md`
