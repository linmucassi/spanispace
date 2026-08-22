# 22 Aug 2026 (4)

## Fix: removed 12 fabricated "informal job" listings from production

Linda asked whether the informal-work job listings on the public jobs board were real, suspecting they were dummy data from earlier development. She was right, and it was worse than the static fallback list she was likely looking at.

**Two separate places had this fake data:**

1. `data/constants.ts`'s `JOBS` array (the static fallback `lib/publicJobs.ts` serves only when Supabase has zero active/verified jobs) had 6 fabricated entries (ids 16-21: Harbour View Restaurant, Sunrise Superette, Mzansi Building Projects, Private household ×1, Fashion Corner, Kasi Flavours Kitchen) — obviously placeholder: fake company names, empty `applyLink`, hardcoded `expiryDate: '2026-12-31'`, all marked `VettedStatus.VERIFIED` despite never having been vetted.
2. **More seriously**: `supabase/add-informal-jobs.sql` (run against production 13 Aug 2026, per the roadmap's migration-verification pass) directly seeded **12 fabricated job listings** into the live `jobs` table — Harbour View Restaurant, Kasi Flavours Kitchen, Sunrise Superette, Mzansi Building Projects, Private household ×3, Shield Security Services, Fashion Corner, Sparkle Car Wash, QuickBite Deliveries, Community Spaza — all `vetted_status: 'verified'`, `status: 'active'`. These have been showing to real site visitors as genuine job listings for over a week.

Checked for real-world consequences before touching anything, since `applications.job_id` cascades on delete: **2 real applications existed against these fake jobs.** One was Linda's own test account. The other was a genuine candidate — SNOTHANDO DLULISA (0601980446, amandelasnothando@gmail.com, Cape Town) — who applied 14 Aug to the fake "Waiter (3 Month Contract)" listing believing it was real, with a CV and a real about-you write-up (customer service, sales operations, cash/POS, training/mentoring background).

Surfaced this to Linda before deleting anything (a real person's data was about to be destroyed, not just cleanup of placeholder content) and gave her SNOTHANDO's full contact details so she could follow up herself. She chose to delete everything rather than preserve the orphaned application record.

**Done:**
- Deleted all 12 seeded job rows from the live `jobs` table (cascaded both applications with them) via a one-off script using the service-role client, same pattern as every other one-off DB operation this session.
- Removed the same 6 fabricated entries from `data/constants.ts`'s `JOBS` fallback array.
- Stripped the seed block out of `supabase/add-informal-jobs.sql` entirely (kept the real schema changes: `job_type` widening for Piece Job/Temporary, `jobs.duration`, `candidate_profiles.professional_summary`, the `work_experiences` table, the `apply_link` index) — so a future run of this file against a fresh database can never reintroduce this. The `seed_history` table and its `'informal-jobs-2026-07'` marker row are left alone in production as a tombstone: the file no longer references that key at all, so there's nothing left that could re-seed against it, but removing the marker itself wasn't necessary and touching it added no value.

**Verified:** `npx tsc --noEmit` clean after the `constants.ts` edit.

**Still to do (not something I can do):** Linda should reach out to SNOTHANDO DLULISA directly, since Spanispace has no real waiter listing to redirect them to.

## Files changed
```
M  data/constants.ts
M  supabase/add-informal-jobs.sql
```
