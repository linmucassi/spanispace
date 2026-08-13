# 13 Aug 2026 (cont.)

## AI CV Audit: paste box replaced with upload, and it now offers to fill your profile too

User ask: both "AI CV Audit" and the CV upload on "My Profile" should accept a document, analyse it, and use it to populate the profile — CV Audit specifically should stop asking for a manual paste.

Before this, the two CV flows in the app were inconsistent:
- `components/candidate/CvAutofill.tsx` ("Fill from my CV" on the onboarding and profile pages) already did exactly what was asked — upload a PDF, read it with Claude, review/edit the extracted fields, then use them to fill the profile form. No change needed there for the "My Profile" half of the ask.
- `/candidate/cv-audit` did none of that. It was a `<textarea>` the candidate pasted CV text into, sent to `/api/cv-audit`, which returned a score/strengths/improvements/quick-wins JSON and nothing else — no document, no storage, no connection to the profile at all.

## Changes

**Shared the review UI instead of duplicating it.** Extracted the "here's what we found, edit before you use it" form out of `CvAutofill.tsx` into a new `components/candidate/CvExtractedReview.tsx` (also now home to the `CvAutofillResult`/`CvAutofillWorkEntry` types and `emptyCvAutofillResult`), since the CV Audit page needed the identical editable-fields-plus-work-experience-list UI. `CvAutofill.tsx` now renders `<CvExtractedReview>` instead of ~150 lines of inline JSX it used to own directly; re-exports the types from their new home so `app/candidate/onboarding/page.tsx` and `app/candidate/profile/page.tsx` didn't need import changes.

**`/api/cv-audit/route.ts`** rewritten to take `documentId` (an already-uploaded `candidate_documents` PDF row) instead of `cvText`, mirroring `/api/cv-extract`'s document-reading approach exactly: fetch the row (RLS-scoped to the caller), fetch the PDF bytes, base64-encode, attach as a `document` content block. One Claude call now returns both halves in one response — the audit fields at the top level (`score`, `headline`, `strengths`, `improvements`, `quickWins`) and the same extraction shape cv-extract produces nested under `extracted`. Rate limit tightened from 8/hour to 5/hour to match cv-extract's window, since this now attaches a full PDF per call instead of just text.

**`app/candidate/cv-audit/page.tsx`** rewritten: the paste `<textarea>` is gone. Upload flow is the same as `CvAutofill.tsx` — validates PDF + 10 MB, uploads to the `documents` bucket, inserts a `candidate_documents` row (`doc_type: 'cv'`) so it also shows up in the document library and counts toward profile completeness, not just this page's audit — then POSTs `documentId` to the rewritten `/api/cv-audit`. Results page is unchanged for the audit cards (score/strengths/improvements/quick wins), with a new section below them: the shared `<CvExtractedReview>` form pre-filled from the same response, and a "Save to my profile" button.

That save button merges non-destructively into whatever the candidate already has — the same rule `app/candidate/profile/page.tsx`'s `handleCvExtracted` already follows (a CV silent on a field never blanks one already on file, skills union rather than replace, `normalizeUrl` applied to LinkedIn/GitHub). It has to re-fetch the current `candidate_profiles` row itself first, since unlike the profile page this is a standalone page with no already-loaded profile state to merge against.

## Files changed
```
A  components/candidate/CvExtractedReview.tsx
M  components/candidate/CvAutofill.tsx
M  app/api/cv-audit/route.ts
M  app/candidate/cv-audit/page.tsx
M  docs/ROADMAP.md
```
