# 13 Aug 2026

## Fix: "infinite recursion detected in policy for relation candidate_profiles"

User report: saving the candidate onboarding form ("Just one more step") failed with `We could not save your details. Please try again. (infinite recursion detected in policy for relation "candidate_profiles")`.

Root cause: `supabase/fix-security-hardening.sql` (16 Jul 2026 audit, section 5, "Companies read applicant profiles") added a `candidate_profiles` SELECT policy that queries `applications` directly:

```
candidate_profiles SELECT policy -> EXISTS (SELECT ... FROM applications ...)
```

But `applications` already has its own SELECT policy ("Candidates read own applications") that queries back into `candidate_profiles`. Any query touching `candidate_profiles` evaluates every SELECT policy on it — including this one — which pulls in `applications`, whose policy pulls in `candidate_profiles` again, forever. This is the exact class of bug `supabase/fix-rls-recursion.sql` had already fixed once for the admin policies (same fix noted at `schema.sql:300`), but the hardening migration reintroduced it for this one policy without going through the same SECURITY DEFINER pattern.

Fix: added `public.company_has_applicant(candidate_id)`, a `SECURITY DEFINER` function (bypasses RLS on its internal lookup, same pattern as `is_admin()` and `has_applied_to_job()`), and pointed the policy at it instead of the inline subquery.

- `supabase/schema.sql`: added `public.company_has_applicant()` next to the other RLS-recursion-safe helpers, and added the `"Companies read applicant profiles"` policy to the candidate_profiles section (it existed live via the hardening migration but had never been folded back into schema.sql, so a fresh `schema.sql` run would not have reproduced the bug — only the live DB had it).
- New `supabase/fix-candidate-profile-visibility-recursion.sql` — run once in the Supabase Dashboard SQL Editor against the live project to replace the broken policy.

## Verified which migrations are actually live, instead of guessing

Two bugs in a row (the recursion above, then `Could not find the 'github_url' column`) both turned out to be the same root cause: `docs/ROADMAP.md` had ~19 migration files marked "code-complete, migration status unverified" — nobody actually knew which had been run against production. Asked to check every migration against production instead of continuing to fix symptoms one at a time.

There's no direct Postgres connection available (no `DATABASE_URL` in `.env.local`, no connected Supabase MCP server this session), so verification was done against the live database itself via Supabase's own PostgREST API, using the service-role key already present in `.env.local`:

- `GET {SUPABASE_URL}/rest/v1/` with `Accept: application/openapi+json` — PostgREST's auto-generated schema, listing every table/column and every RPC-exposed function the API currently sees. Used to get a first-pass snapshot.
- Targeted follow-up queries (`GET .../candidate_profiles?select=professional_summary`, `POST .../rpc/has_applied_to_job`, etc.) to get real Postgres errors rather than relying on the OpenAPI cache, which can lag behind actual DDL. All read-only, nothing written or executed.

**Confirmed NOT applied**, with the actual errors as evidence:
- `supabase/add-informal-jobs.sql` — `42703 column jobs.duration does not exist`, `42703 column candidate_profiles.professional_summary does not exist`, `PGRST205 table 'public.work_experiences' not found`.
- `supabase/add-training-levels.sql` — `42703 column trainings.level does not exist`.
- `supabase/fix-application-visibility.sql` — `PGRST202`, the `has_applied_to_job` function doesn't exist.

**Follow-up:** user hit "Upload failed: Bucket not found" on avatar upload. Storage buckets live outside the Postgres schema the checks above covered (a separate Storage API, not PostgREST), so this was missed on the first pass. Checked `GET {SUPABASE_URL}/storage/v1/bucket` directly: only `cvs` and `documents` exist, no `avatars`. `supabase/create-avatar-bucket.sql` was never run — `AvatarUpload.tsx` has been failing every upload since the avatar feature shipped (11 Aug 2026). Added to the roadmap's confirmed-not-applied list and the run order.

**Confirmed applied**, also by direct query: `company_has_applicant()` (the RLS fix above), `is_admin()`, `is_thread_party()`/`is_thread_participant()`, `candidate_profiles.github_url`/`linkedin_url`/`avatar_url`, `applications.documents`, `trainings`/`events` `company_id`/`vetted_status`, and every table from add-messaging/add-auto-apply/add-job-analytics/add-documents-table/add-academy-progress/add-candidate-education/add-notifications-and-profile-scoring.

The `github_url` error from the earlier report could not be reproduced against the live database — the column is there and queryable now. Most likely a transient PostgREST schema-cache lag right after the column was added (or added since), not an ongoing issue.

`docs/ROADMAP.md`'s "Outstanding: Production Migrations" section updated with this as ground truth in place of the blanket "unverified" note, with the confirmed action list: run `add-informal-jobs.sql`, then `add-training-levels.sql`, then `fix-application-visibility.sql`, then `create-avatar-bucket.sql`. **User confirmed all four ran later the same day.**

## Avatar upload: images uploaded but didn't render

Report (after the four migrations above ran): any image uploaded as a profile picture "doesn't show." The `avatars` bucket restricts uploads to `image/jpeg`/`png`/`webp` (`supabase/create-avatar-bucket.sql`), but `AvatarUpload.tsx` only checked `file.type.startsWith('image/')` before uploading. A phone photo in HEIC (iPhone's default camera format) passes that loose check — Storage would then either reject it outright, or in some cases accept it as an opaque blob that no browser can decode inside an `<img>` tag, rendering nothing either way.

Fixed by resizing and re-encoding every upload to JPEG client-side (`components/candidate/AvatarUpload.tsx`, new `resizeImage()`): loads the file into an `<img>`, draws it onto a canvas capped at 512px on the long side, and exports via `canvas.toBlob(..., 'image/jpeg', 0.85)`. This guarantees a browser-renderable format regardless of source and keeps multi-MB camera photos comfortably under the bucket's 2 MB cap without needing the original to already fit. If the browser genuinely can't decode the source at all, the user now sees "Could not read that image — try a JPEG or PNG" instead of a silent failure.

## "Could not read that image" on every avatar upload, even valid JPEG/PNG

Report: the resize fix above was throwing "Could not read that image — try a JPEG or PNG" on files that were already the right format. The message is misleading about the actual cause: `resizeImage()` loads the picked file via `URL.createObjectURL(file)` and points an `<img>` at the resulting `blob:` URL so it can be drawn onto a canvas. `next.config.ts`'s CSP `img-src` was `'self' data: https://upload.wikimedia.org https://picsum.photos` — no `blob:` — so the browser blocked the load outright and fired `onerror` regardless of whether the file could actually be decoded.

Checked for the same gap on the other side of the flow: the avatar `<img avatarUrl>` in the same component points straight at the Supabase Storage public URL (not proxied through `next/image`), which also wasn't in `img-src`. Fixing only `blob:` would have let the resize succeed and then hit the exact same class of bug rendering the result — an image that uploads fine and still doesn't show.

Fixed both in one pass, `next.config.ts`:
```
img-src 'self' data: https://upload.wikimedia.org https://picsum.photos
->
img-src 'self' data: blob: https://*.supabase.co https://upload.wikimedia.org https://picsum.photos
```
`blob:` for the client-side resize step, `https://*.supabase.co` (matching the pattern `connect-src` already uses) for avatars and CVs served directly from Storage.

Next.js reads `next.config.ts` at server start, not per-request — needs a dev server restart (or a fresh deploy in production) to take effect, unlike the component-level fixes above.

## Profile-completeness checklist didn't check off an uploaded CV

Report: uploading a CV didn't update the "Finish your profile" checklist. Traced to `candidate_profiles.cv_url` — a column that predates the multi-document library (`candidate_documents`, `doc_type = 'cv'`, shipped later). Nothing in the current app writes to `cv_url` anymore; CV upload goes through `DocumentLibrary.tsx`, which only inserts into `candidate_documents`. But both the client checklist (`lib/profileCompleteness.ts`) and the DB `profile_score` trigger (`compute_profile_score()`) still read the dead `cv_url` column.

Separately, even a corrected check wouldn't have worked on its own: `compute_profile_score()` runs as a `BEFORE UPDATE` trigger on `candidate_profiles`, and a CV upload only ever writes to `candidate_documents` — so the score was never recalculated at the moment a CV was added, regardless of what the trigger checked.

Fixed on both sides:
- **App:** `lib/profileCompleteness.ts` — `ProfileCompletenessInput.cv_url` replaced with `hasCv: boolean`. `app/candidate/dashboard/page.tsx` now queries `candidate_documents` (`count`, `doc_type = 'cv'`) alongside the profile fetch and passes `hasCv` into `ProfileCompletenessCard`. `scripts/run-profile-nudges.ts` (the weekly "finish your profile" email) does the same in bulk — one query for all `doc_type = 'cv'` rows, turned into a `Set<user_id>` — so the nudge email's missing-fields list matches what the dashboard shows.
- **Database:** new `supabase/fix-cv-completeness.sql` — rewrites `compute_profile_score()` to check `EXISTS (SELECT 1 FROM candidate_documents WHERE user_id = NEW.user_id AND doc_type = 'cv')` instead of `NEW.cv_url`, and adds `trg_touch_profile_score_on_document_change` (`AFTER INSERT OR DELETE ON candidate_documents`) that re-touches the owner's `candidate_profiles` row so the `BEFORE UPDATE` trigger actually re-fires when a CV is added or removed. Includes a one-time backfill (`UPDATE candidate_profiles SET updated_at = updated_at`) so candidates who already uploaded a CV don't need to re-save their profile to get credit for it.

**Follow-up: the same bug on the company side.** Flagged the identical issue in `app/company/candidates/CandidateSearch.tsx` — its "Download CV" link also reads `candidate_profiles.cv_url`. User asked to fix it too.

Turned out to be two bugs stacked, not one: fixing the column reference alone would not have worked, because `candidate_documents` has exactly one RLS policy — `"Candidates manage own documents"`, owner-only (`auth.uid() = user_id`). No policy ever let a company read *any* candidate's document row, so even a correct query would have silently come back empty under RLS.

Added a second policy to `supabase/fix-cv-completeness.sql`, section 4 — `"Companies read applicant CVs"`, scoped identically to the existing `"Companies read applicant profiles"` policy (same `company_has_applicant()` SECURITY DEFINER helper from the RLS-recursion fix above, so it can't reopen that recursion), and further restricted to `doc_type = 'cv'` only — a company still can't read a candidate's certificates, cover letters, or other private documents, just the CV, and only for a candidate who actually applied to one of their jobs.

`app/company/candidates/page.tsx` now does a second query for `candidate_documents` (`doc_type = 'cv'`, `user_id IN (...)`) after fetching candidates, picks each candidate's most recent CV, and merges its `file_url` into the `cv_url` field before handing the list to `CandidateSearch.tsx` — which needed no changes at all, since it was already rendering whatever `cv_url` it was given. **`supabase/fix-cv-completeness.sql` not yet run in production as of this fix.**

## AI CV Audit: paste box replaced with upload, and it now offers to fill your profile too

User ask: both "AI CV Audit" and the CV upload on "My Profile" should accept a document, analyse it, and use it to populate the profile — CV Audit specifically should stop asking for a manual paste.

Before this, the two CV flows in the app were inconsistent:
- `components/candidate/CvAutofill.tsx` ("Fill from my CV" on the onboarding and profile pages) already did exactly what was asked — upload a PDF, read it with the LLM, review/edit the extracted fields, then use them to fill the profile form. No change needed there for the "My Profile" half of the ask.
- `/candidate/cv-audit` did none of that. It was a `<textarea>` the candidate pasted CV text into, sent to `/api/cv-audit`, which returned a score/strengths/improvements/quick-wins JSON and nothing else — no document, no storage, no connection to the profile at all.

**Shared the review UI instead of duplicating it.** Extracted the "here's what we found, edit before you use it" form out of `CvAutofill.tsx` into a new `components/candidate/CvExtractedReview.tsx` (also now home to the `CvAutofillResult`/`CvAutofillWorkEntry` types and `emptyCvAutofillResult`), since the CV Audit page needed the identical editable-fields-plus-work-experience-list UI. `CvAutofill.tsx` now renders `<CvExtractedReview>` instead of ~150 lines of inline JSX it used to own directly; re-exports the types from their new home so `app/candidate/onboarding/page.tsx` and `app/candidate/profile/page.tsx` didn't need import changes.

**`/api/cv-audit/route.ts`** rewritten to take `documentId` (an already-uploaded `candidate_documents` PDF row) instead of `cvText`, mirroring `/api/cv-extract`'s document-reading approach exactly: fetch the row (RLS-scoped to the caller), fetch the PDF bytes, base64-encode, attach as a document content part. One model call now returns both halves in one response — the audit fields at the top level (`score`, `headline`, `strengths`, `improvements`, `quickWins`) and the same extraction shape cv-extract produces nested under `extracted`. Rate limit tightened from 8/hour to 5/hour to match cv-extract's window, since this now attaches a full PDF per call instead of just text.

**`app/candidate/cv-audit/page.tsx`** rewritten: the paste `<textarea>` is gone. Upload flow is the same as `CvAutofill.tsx` — validates PDF + 10 MB, uploads to the `documents` bucket, inserts a `candidate_documents` row (`doc_type: 'cv'`) so it also shows up in the document library and counts toward profile completeness, not just this page's audit — then POSTs `documentId` to the rewritten `/api/cv-audit`. Results page is unchanged for the audit cards (score/strengths/improvements/quick wins), with a new section below them: the shared `<CvExtractedReview>` form pre-filled from the same response, and a "Save to my profile" button.

That save button merges non-destructively into whatever the candidate already has — the same rule `app/candidate/profile/page.tsx`'s `handleCvExtracted` already follows (a CV silent on a field never blanks one already on file, skills union rather than replace, `normalizeUrl` applied to LinkedIn/GitHub). It has to re-fetch the current `candidate_profiles` row itself first, since unlike the profile page this is a standalone page with no already-loaded profile state to merge against.

## Switched every AI feature from Claude to Gemini, for the free tier

User doesn't have (and doesn't want to pay for) an Anthropic API key. Asked to research free alternatives and apply one. OpenAI and Google Gemini were the two named candidates.

**Research finding, not assumed:** OpenAI's API does not have a genuine free tier as of Aug 2026 — the API rate-limits page lists most models as "Free: Not supported," and the only real no-cost path is an opt-in program that trades free daily tokens for data sharing on every request, not a clean free key. Google's Gemini API does have a real free tier: no billing method required, `gemini-2.5-flash` and newer are free of charge on Google AI Studio, with a request-volume ceiling (roughly 10 RPM / 250 RPD per project at the time of writing) that comfortably covers this app's existing self-imposed per-user limits (5-8 requests/hour). Verified directly against `ai.google.dev`'s own pricing page rather than trusting a single blog post, since free-tier terms change often. Went with Gemini.

**Dependency swap:** removed `@anthropic-ai/sdk`, added `@google/genai` (the current official Node SDK — verified its actual shipped type definitions in `node_modules` before writing any code against it, rather than trusting SDK examples from web search alone).

**All three AI endpoints rewritten** to call `ai.models.generateContent({ model: 'gemini-2.5-flash', ... })` instead of the Anthropic client: `app/api/cv-extract/route.ts` (CV -> structured profile fields), `app/api/cv-audit/route.ts` (CV -> audit + structured profile fields, the combined endpoint above), and `app/api/profile-summary/route.ts` (work history -> professional summary, text-only, no PDF).

Same shape as before functionally (same request/response contracts, same per-user rate limits, same error messages where the cause is the same), with two implementation simplifications the swap enabled:
- `config: { responseMimeType: 'application/json' }` makes Gemini return valid JSON directly, instead of the markdown-fence-stripping regex extraction the Claude version needed as a fallback (kept as a defensive `.match(/\{[\s\S]*\}/)` after `response.text`, in case the model still wraps output despite the config, but no longer the primary mechanism).
- `thinkingConfig: { thinkingBudget: 0 }` disables Gemini's reasoning step — these are mechanical extraction/scoring tasks, not multi-step reasoning, and disabling it keeps latency down and free-tier token usage lower.
- PDF input uses `inlineData: { mimeType: 'application/pdf', data: base64 }` in a content part, Gemini's native equivalent of Claude's `document` content block — same base64-encode-and-attach approach, no text-extraction library needed, same as before.

Added a `429` branch distinct from other provider errors (checked via `err instanceof ApiError` from `@google/genai`), since hitting the *free-tier* rate limit is a real, expected possibility now in a way it effectively wasn't on a paid Claude key, and deserves its own message rather than the generic "temporarily unavailable."

**Config:** `.env.example`'s `ANTHROPIC_API_KEY` entry replaced with `GEMINI_API_KEY` (get one free at `aistudio.google.com/apikey`, no billing method needed). **`.env.local` was not touched** — add `GEMINI_API_KEY` there to test locally, the same way `ANTHROPIC_API_KEY` needed to be added before.

**Legal pages corrected**, not just find-replaced — Section 10 of `app/(public)/privacy/page.tsx` still described the old paste-based, not-stored CV Audit design from before the upload-based rework above, which was no longer accurate even before this provider swap (the uploaded CV has been stored in the document library since that change, same as any other document). Rewritten to describe what the features actually do now: an uploaded CV (or, for the profile builder, existing work history) is sent to Google's Gemini API, the CV itself is retained via the same Document Storage rules as Section 11, and results are always shown for review before anything saves. `app/(public)/terms/page.tsx` Section 12 updated the same way, provider name and "CV text" -> "CV, or your work history" to match. `app/candidate/cv-audit/page.tsx`'s disclaimer footer updated to name Google's Gemini API instead of Anthropic's.

**Deliberately left alone:** `data/academy.ts` (SpaniSpace Academy course content that discusses Claude/ChatGPT/Gemini generically as part of AI-literacy lessons — unrelated to which provider this app's own backend calls) and `app/robots.ts` (blocks `ClaudeBot`/`GPTBot`/etc. AI crawlers from indexing the site — an unrelated SEO concern, nothing to do with which API this app calls server-side).

**One thing to watch:** Gemini's free tier is a *shared, project-wide* daily cap (~250 requests/day across all three endpoints combined at the time of writing), not a per-user one. The app's own 5/hour-per-user limiter still applies unchanged, but it doesn't protect against the free tier's daily ceiling if usage grows — worth revisiting if these features get real traffic.

## Files changed
```
A  components/candidate/CvExtractedReview.tsx
A  supabase/fix-candidate-profile-visibility-recursion.sql
A  supabase/fix-cv-completeness.sql
M  .env.example
M  app/(public)/privacy/page.tsx
M  app/(public)/terms/page.tsx
M  app/api/cv-audit/route.ts
M  app/api/cv-extract/route.ts
M  app/api/profile-summary/route.ts
M  app/candidate/cv-audit/page.tsx
M  app/candidate/dashboard/page.tsx
M  app/company/candidates/page.tsx
M  components/candidate/AvatarUpload.tsx
M  components/candidate/CvAutofill.tsx
M  docs/ROADMAP.md
M  lib/profileCompleteness.ts
M  next.config.ts
M  package.json
M  package-lock.json
M  scripts/run-profile-nudges.ts
M  supabase/schema.sql
```
