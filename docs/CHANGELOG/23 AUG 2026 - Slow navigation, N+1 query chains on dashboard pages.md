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

## Fix: safeguard against garbled/mojibake job listings

Linda found `"æ°åªä½è¿"` in the jobs listings and flagged it as unreadable, unsafe data that needs guarding against. Scanned the live `jobs` table (340 rows) for it directly rather than guessing at scope: found exactly 2, both genuinely Chinese-language postings (Volkswagen China and Meituan) whose text had been corrupted into mojibake somewhere upstream of this app — most likely a scraper source not honouring its own response charset.

**Why the existing safeguard missed it:** this app already had two "reject non-Latin characters" filters (`lib/scrapers/db-writer.ts`'s `isLatinJob()` at write time, `lib/publicJobs.ts`'s `isEnglishReadable()` at read time), both designed to catch genuine CJK/Arabic/Cyrillic script. Mojibake doesn't trip either one: when UTF-8 bytes of a CJK character get misread as Latin-1/CP1252 and re-encoded, the result lands entirely within the Latin-1 Supplement block (e.g. `æ`, `°`, `å` are all real Latin-range codepoints) — garbled, but structurally "Latin" by the letter of what those filters check.

**Fixed:**
- New `lib/textQuality.ts` — `isMojibake()`, which reinterprets each character as a raw byte (what actually happened during the original corruption) and tries to re-decode those bytes as UTF-8. If that recovers real CJK/Hiragana-Katakana/Hangul/Arabic/Cyrillic text, the input was mojibake of exactly that script.
- Wired into both existing gates: `isLatinJob()` (primary filter, write time) and `isEnglishReadable()` (defense-in-depth, read time, catches anything already in the table or written some other way) now both call it alongside their existing script check.
- Deleted the 2 bad rows from production (checked for real applications against them first — zero, safe to remove outright, unlike the informal-jobs cleanup yesterday which had a real applicant attached).

**Verified:** `npx tsc --noEmit` clean; re-loaded the live `/jobs` page after the fix and confirmed no mojibake or error text in the response.

## Add: per-section saving on the candidate profile

Linda asked for auto-save on the profile page, or as an alternative, separate save buttons per section so a change to one part doesn't require scrolling to the bottom. Went with per-section saves rather than continuous auto-save: this codebase already had two sections (Education, Work Experience) that save themselves independently the moment you add/edit an entry, each backed by its own table — building the rest of the page to match that existing pattern is simpler and more predictable than a debounced auto-save (no "did that actually save?" uncertainty, no risk of persisting a half-typed value, no new race-condition surface).

The remaining 5 sections (Personal Information, Talent Pool Visibility, Skills, Online Presence, Professional Profile) all live on the single `candidate_profiles` row and used to share one big "Save Profile" button at the very bottom of the page. Split into independent saves:
- **Personal Information** — own Save button (name/phone/whatsapp/location; avatar already saved itself via its own upload flow, unaffected).
- **Talent Pool Visibility** — saves instantly the moment the checkbox is toggled, no button at all; reverts the toggle if the save fails rather than showing a state that was never actually persisted.
- **Skills** — saves immediately on each Add/Remove action (not per keystroke — the natural interaction point already existed, it just wasn't being used to save).
- **Online Presence** — own Save button (portfolio/LinkedIn/GitHub URLs).
- **Professional Profile** — own Save button, next to the existing "Build for me" button.

Each section's save now uses a scoped `.update()` (not `.upsert()`) — every candidate already has a `candidate_profiles` row by the time they reach this page (`handle_new_user()` creates one at signup), so there's no "create the row" branch to worry about, and it sidesteps `full_name`'s `NOT NULL` constraint ever tripping up a save that only touches e.g. `skills`. This also simplified the old multi-step schema-fallback retry logic (drop `open_to_offers`, retry, drop `professional_summary`, retry) into "this field's own section shows an error if its column isn't live yet" — each section's save only ever touches its own columns.

Small "Saved ✓" indicator per section instead of one page-wide banner, so saving one section doesn't visually imply anything about the others.

**Verified:** `npx tsc --noEmit` and `npm run build` both clean; confirmed `/candidate/profile` still redirects unauthenticated visitors correctly.

## Fix: mojibake safeguard was too narrow — widened to every field, plus events

Linda pointed out the fix above was incomplete: "I hope you fixing the unreadable data on all feilds of a job and other related crons because I see other jobs it's the title, or the date, or the salary, in short various feilds." Correct — the write-time filter (`isLatinJob()` in `lib/scrapers/db-writer.ts`) only ever looked at `title` and `poster_name`, and only ever *rejected*, never repaired. A live re-scan using the same `repairEncoding()` mechanism from the fix above, but run against every text field, found the real scope: **155 of 338 job rows** had corrupted text — not foreign-script garbage this time, but ordinary punctuation (en-dashes, curly quotes/apostrophes) inside `description`, mostly, corrupted into invisible C1 control characters the same way the original `"1â3+ years"` case was. Zero rows were genuinely foreign-script (the 2 found in the fix above are already gone, and no new ones appeared).

**Fixed:**
- `lib/scrapers/db-writer.ts` — `writeJobs()`'s old title/poster_name-only `isLatinJob()` gate replaced with `repairAndCheckJob()`, which runs `repairEncoding()` (not just a reject-check) across all 7 text fields a scraped job actually has: `title`, `description`, `requirements`, `location`, `poster_name`, `salary_range`, `duration`. Recoverable corruption gets fixed in place before insert; only genuine foreign-script content (after repair) is rejected, same policy as before.
- `writeEvents()` in the same file had **zero** text-quality filtering of any kind before this — not even the old narrow title check job postings had. Added the equivalent `repairAndCheckEvent()` covering `title`, `description`, `location` before insert. (The `events` table is currently empty, so there was nothing to retroactively fix there, but future scraper runs are now covered.)
- Live re-scan and repair of the existing `jobs` table (not `isLatinJob()`-equivalent guesswork — re-ran the real `repairEncoding()` detector across all 7 fields on all 338 rows): found and fixed 155 rows with recoverable corruption via a targeted `UPDATE` of only the affected field(s) per row. Re-scanned afterward: 0 remaining corrupted rows, 0 foreign-script rows. No rows deleted this round — everything found was repairable, unlike the 2 rows removed in the fix above which were unrecoverable foreign-script postings.

**Verified:** `npx tsc --noEmit` and `npm run build` both clean. Fetched the live `/jobs` page from a local dev server and checked the raw response byte-by-byte in Node for C1 control characters (the corruption signature) — zero found.

## Files changed
```
A  lib/textQuality.ts
M  app/candidate/dashboard/page.tsx
M  app/candidate/profile/page.tsx
M  app/company/candidates/page.tsx
M  app/company/dashboard/page.tsx
M  app/company/profile/page.tsx
M  lib/company/resolveCompanyMembership.ts
M  lib/publicJobs.ts
M  lib/scrapers/db-writer.ts
```
