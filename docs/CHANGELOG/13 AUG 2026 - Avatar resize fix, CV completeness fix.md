# 13 Aug 2026 (cont.)

Migrations from earlier today (`add-informal-jobs.sql`, `add-training-levels.sql`, `fix-application-visibility.sql`, `create-avatar-bucket.sql`) confirmed run by the user. Two more bugs surfaced immediately after.

## Avatar upload: images uploaded but didn't render

Report: any image uploaded as a profile picture "doesn't show." The `avatars` bucket restricts uploads to `image/jpeg`/`png`/`webp` (`supabase/create-avatar-bucket.sql`), but `AvatarUpload.tsx` only checked `file.type.startsWith('image/')` before uploading. A phone photo in HEIC (iPhone's default camera format) passes that loose check — Storage would then either reject it outright, or in some cases accept it as an opaque blob that no browser can decode inside an `<img>` tag, rendering nothing either way.

Fixed by resizing and re-encoding every upload to JPEG client-side (`components/candidate/AvatarUpload.tsx`, new `resizeImage()`): loads the file into an `<img>`, draws it onto a canvas capped at 512px on the long side, and exports via `canvas.toBlob(..., 'image/jpeg', 0.85)`. This guarantees a browser-renderable format regardless of source and keeps multi-MB camera photos comfortably under the bucket's 2 MB cap without needing the original to already fit. If the browser genuinely can't decode the source at all, the user now sees "Could not read that image — try a JPEG or PNG" instead of a silent failure.

## Profile-completeness checklist didn't check off an uploaded CV

Report: uploading a CV didn't update the "Finish your profile" checklist. Traced to `candidate_profiles.cv_url` — a column that predates the multi-document library (`candidate_documents`, `doc_type = 'cv'`, shipped later). Nothing in the current app writes to `cv_url` anymore; CV upload goes through `DocumentLibrary.tsx`, which only inserts into `candidate_documents`. But both the client checklist (`lib/profileCompleteness.ts`) and the DB `profile_score` trigger (`compute_profile_score()`) still read the dead `cv_url` column.

Separately, even a corrected check wouldn't have worked on its own: `compute_profile_score()` runs as a `BEFORE UPDATE` trigger on `candidate_profiles`, and a CV upload only ever writes to `candidate_documents` — so the score was never recalculated at the moment a CV was added, regardless of what the trigger checked.

Fixed on both sides:
- **App:** `lib/profileCompleteness.ts` — `ProfileCompletenessInput.cv_url` replaced with `hasCv: boolean`. `app/candidate/dashboard/page.tsx` now queries `candidate_documents` (`count`, `doc_type = 'cv'`) alongside the profile fetch and passes `hasCv` into `ProfileCompletenessCard`. `scripts/run-profile-nudges.ts` (the weekly "finish your profile" email) does the same in bulk — one query for all `doc_type = 'cv'` rows, turned into a `Set<user_id>` — so the nudge email's missing-fields list matches what the dashboard shows.
- **Database:** new `supabase/fix-cv-completeness.sql` (**not yet run in production**) — rewrites `compute_profile_score()` to check `EXISTS (SELECT 1 FROM candidate_documents WHERE user_id = NEW.user_id AND doc_type = 'cv')` instead of `NEW.cv_url`, and adds `trg_touch_profile_score_on_document_change` (`AFTER INSERT OR DELETE ON candidate_documents`) that re-touches the owner's `candidate_profiles` row so the `BEFORE UPDATE` trigger actually re-fires when a CV is added or removed. Includes a one-time backfill (`UPDATE candidate_profiles SET updated_at = updated_at`) so candidates who already uploaded a CV don't need to re-save their profile to get credit for it.

## Follow-up, same day: the same bug on the company side

Flagged the identical issue in `app/company/candidates/CandidateSearch.tsx` — its "Download CV" link also reads `candidate_profiles.cv_url`. User asked to fix it too.

Turned out to be two bugs stacked, not one: fixing the column reference alone would not have worked, because `candidate_documents` has exactly one RLS policy — `"Candidates manage own documents"`, owner-only (`auth.uid() = user_id`). No policy ever let a company read *any* candidate's document row, so even a correct query would have silently come back empty under RLS.

Added a second policy to `supabase/fix-cv-completeness.sql`, section 4 — `"Companies read applicant CVs"`, scoped identically to the existing `"Companies read applicant profiles"` policy (same `company_has_applicant()` SECURITY DEFINER helper from the 13 Aug RLS-recursion fix, so it can't reopen that recursion), and further restricted to `doc_type = 'cv'` only — a company still can't read a candidate's certificates, cover letters, or other private documents, just the CV, and only for a candidate who actually applied to one of their jobs.

`app/company/candidates/page.tsx` now does a second query for `candidate_documents` (`doc_type = 'cv'`, `user_id IN (...)`) after fetching candidates, picks each candidate's most recent CV, and merges its `file_url` into the `cv_url` field before handing the list to `CandidateSearch.tsx` — which needed no changes at all, since it was already rendering whatever `cv_url` it was given.

## Files changed
```
M  components/candidate/AvatarUpload.tsx
M  lib/profileCompleteness.ts
M  app/candidate/dashboard/page.tsx
M  scripts/run-profile-nudges.ts
M  app/company/candidates/page.tsx
A  supabase/fix-cv-completeness.sql
M  docs/ROADMAP.md
```
