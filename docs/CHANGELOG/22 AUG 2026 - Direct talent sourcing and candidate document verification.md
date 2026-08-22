# 22 Aug 2026 (3)

## Add: Direct Talent Sourcing + Candidate Document Verification

Linda proposed two more candidate journeys on top of the application-journeys work shipped earlier today: companies searching and inviting candidates directly from a talent pool instead of only waiting for applications, and a guided document-verification flow producing a standing "Verified" badge.

Researched the existing infrastructure first rather than assuming a blank slate — there was real prior art that changed the scope:

- `app/company/candidates/CandidateSearch.tsx` already lets a company browse/filter candidates, but only ones who **already applied to one of their jobs** — enforced by RLS (`company_has_applicant()`, a deliberate S3 hardening pass in `fix-security-hardening.sql`, not an oversight). No invite mechanism existed anywhere; messaging was the only contact path.
- `candidate_profiles.verified BOOLEAN DEFAULT FALSE` already existed and was already displayed in 4 places (search cards, profile preview) — but **nothing anywhere ever set it to true**. A dead column, exactly waiting for this feature.
- `candidate_documents.doc_type` only allowed `cv`/`certificate`/`cover_letter`/`motivational_letter`/`other` — no ID/qualification/transcript type, and no verification status of any kind.

Confirmed scope with Linda via AskUserQuestion before planning: talent-pool visibility is **opt-in** (a candidate-controlled toggle, independent of verification — not "verified candidates only" as the literal wording might suggest); document review is **admin-only** (companies never see raw ID/qualification documents, only the resulting badge); verification is a **profile-level standing badge**, verified once, not redone per application.

**Data model** (`supabase/add-talent-sourcing-and-verification.sql`, mirrored into `supabase/schema.sql` — **not yet run against production**):
- `candidate_profiles.open_to_offers BOOLEAN DEFAULT FALSE` — candidate opts in. New RLS policy `"Companies read opted-in candidates"` is **additive** to the existing applicant-only policy (Postgres OR's multiple permissive SELECT policies together) — a company still can't see anyone who hasn't either applied to one of their jobs or opted in.
- New `job_invites` table — a company inviting a candidate to apply for a specific job. Deliberately **not** folded into `applications`: an invite is a signal, not an application. Accepting one routes the candidate through that job's own `/jobs/[id]/apply` flow (respecting whatever `apply_mode` that job already has from this morning's work), so `applications` stays the single source of truth for the hiring pipeline — mirrors how `job_views`/`application_starts` are lightweight signal tables alongside `applications`, not part of it. RLS: a company can only invite someone it's already allowed to see (reuses `company_has_applicant()` in the `WITH CHECK`, so this can't become a second way to enumerate arbitrary candidates); candidate reads/responds to their own; admin full access.
- `candidate_documents.doc_type` extended with `id_document`/`qualification`/`transcript`; new nullable `verification_status`/`verification_note` columns, meaningful only for those three types (the app sets `'pending'` explicitly on upload; the existing five doc types stay `NULL` so nothing renders a stray badge on a CV). New admin blanket RLS policy on `candidate_documents` — it previously had only an owner-only policy plus a CV-only company policy, no admin access at all.
- `candidate_profiles.verified` gets no schema change — it's flipped by an explicit admin click, not a trigger, matching every other `vetted_status` workflow already in this app (jobs/trainings/events/learnerships are all deliberate admin actions, never auto-derived from counts).

**Candidate-facing:**
- `app/candidate/profile/page.tsx` — new "Talent Pool Visibility" toggle, saved with the same schema-fallback-retry pattern already used for `professional_summary` on this page.
- `components/candidate/DocumentLibrary.tsx` — three new doc types in the existing type-driven dropdown (no separate UI needed, it already renders from `DOC_LABELS`), a status pill (Pending review / Verified / Rejected, with the rejection note shown) next to those three types only.
- `app/candidate/dashboard/page.tsx` — a verification-status card and a pending-invites card, switched its profile query to `select('*')` for the same forward-compatibility reason used throughout this session.
- New `app/candidate/invites/page.tsx` + `InviteList.tsx` (added to `CandidateSidebar.tsx` nav) — Accept routes straight into the real job's apply flow; Decline just updates status.

**Company-facing:**
- `app/company/candidates/page.tsx` — **no query change needed** for the pool itself (already `select('*')` on `candidate_profiles`; the new additive RLS policy does the work), but now also fetches the company's own active jobs (for the invite picker), which of the visible candidates are actual applicants (badge-only, RLS already decided visibility), and invites already sent (so the UI doesn't offer to re-invite).
- `CandidateSearch.tsx` — "Applied to your jobs" vs "Open to offers" badge on every card and in the detail modal; an "Invite to apply" flow (job picker + optional message) in the modal, posts to `job_invites`.
- New `app/company/invites/page.tsx` (added to `CompanySidebar.tsx` nav) — sent invites and their status.

**Admin-facing:**
- New `app/admin/candidate-verification/page.tsx` (added to `AdminSidebar.tsx` nav) — candidates grouped by their submitted verification documents, expand to Approve/Reject each (rejection prompts for a note shown back to the candidate), and a "Mark Verified" / "Revoke Verified" action that flips `candidate_profiles.verified` directly.
- New `app/admin/invites/page.tsx` — read-only oversight (same pattern as the university-interest admin page from this morning's feature), nothing to action since companies/candidates own accept/decline and sending.
- `app/admin/dashboard/page.tsx` — "Pending Verifications" and "Open Invites" stat cards, same `StatsCard` pattern as every other count on that page.

**Verified:** `npx tsc --noEmit` and `npm run build` both clean (confirmed all 4 new routes in the build output: `/admin/candidate-verification`, `/admin/invites`, `/candidate/invites`, `/company/invites`). Smoke-tested against the live dev server (migration not yet run, so every new write path is exercising its schema-fallback-retry branch): public pages return 200, every new auth-gated route correctly redirects unauthenticated requests to login rather than erroring.

**Still outstanding, not fixed here:** `supabase/add-talent-sourcing-and-verification.sql` needs to be run in the Supabase SQL Editor against production — third migration handoff today. Until then, every new write path degrades gracefully (same pattern used throughout this session) but none of these features are actually active.

## Files changed
```
A  app/admin/candidate-verification/page.tsx
A  app/admin/invites/page.tsx
A  app/candidate/invites/InviteList.tsx
A  app/candidate/invites/page.tsx
A  app/company/invites/page.tsx
A  supabase/add-talent-sourcing-and-verification.sql
M  app/admin/dashboard/page.tsx
M  app/candidate/dashboard/page.tsx
M  app/candidate/profile/page.tsx
M  app/company/candidates/CandidateSearch.tsx
M  app/company/candidates/page.tsx
M  components/admin/AdminSidebar.tsx
M  components/candidate/CandidateSidebar.tsx
M  components/candidate/DocumentLibrary.tsx
M  components/company/CompanySidebar.tsx
M  supabase/schema.sql
M  types/database.ts
```
