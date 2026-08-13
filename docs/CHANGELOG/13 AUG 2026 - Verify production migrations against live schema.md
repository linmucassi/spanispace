# 13 Aug 2026 (cont.)

## Verified which migrations are actually live, instead of guessing

Two bugs in a row today (`candidate_profiles` RLS recursion, then `Could not find the 'github_url' column`) both turned out to be the same root cause: `docs/ROADMAP.md` had ~19 migration files marked "code-complete, migration status unverified" — nobody actually knew which had been run against production. Asked to check every migration against production instead of continuing to fix symptoms one at a time.

There's no direct Postgres connection available (no `DATABASE_URL` in `.env.local`, no connected Supabase MCP server this session), so verification was done against the live database itself via Supabase's own PostgREST API, using the service-role key already present in `.env.local`:

- `GET {SUPABASE_URL}/rest/v1/` with `Accept: application/openapi+json` — PostgREST's auto-generated schema, listing every table/column and every RPC-exposed function the API currently sees. Used to get a first-pass snapshot.
- Targeted follow-up queries (`GET .../candidate_profiles?select=professional_summary`, `POST .../rpc/has_applied_to_job`, etc.) to get real Postgres errors rather than relying on the OpenAPI cache, which can lag behind actual DDL. All read-only, nothing written or executed.

**Confirmed NOT applied**, with the actual errors as evidence:
- `supabase/add-informal-jobs.sql` — `42703 column jobs.duration does not exist`, `42703 column candidate_profiles.professional_summary does not exist`, `PGRST205 table 'public.work_experiences' not found`.
- `supabase/add-training-levels.sql` — `42703 column trainings.level does not exist`.
- `supabase/fix-application-visibility.sql` — `PGRST202`, the `has_applied_to_job` function doesn't exist.

**Follow-up same day:** user hit "Upload failed: Bucket not found" on avatar upload. Storage buckets live outside the Postgres schema the checks above covered (a separate Storage API, not PostgREST), so this was missed on the first pass. Checked `GET {SUPABASE_URL}/storage/v1/bucket` directly: only `cvs` and `documents` exist, no `avatars`. `supabase/create-avatar-bucket.sql` was never run — `AvatarUpload.tsx` has been failing every upload since the avatar feature shipped (11 Aug 2026). Added to the roadmap's confirmed-not-applied list and the run order.

**Confirmed applied**, also by direct query: `company_has_applicant()` (today's earlier RLS fix), `is_admin()`, `is_thread_party()`/`is_thread_participant()`, `candidate_profiles.github_url`/`linkedin_url`/`avatar_url`, `applications.documents`, `trainings`/`events` `company_id`/`vetted_status`, and every table from add-messaging/add-auto-apply/add-job-analytics/add-documents-table/add-academy-progress/add-candidate-education/add-notifications-and-profile-scoring.

The `github_url` error from the previous report could not be reproduced against the live database — the column is there and queryable now. Most likely a transient PostgREST schema-cache lag right after the column was added (or added since), not an ongoing issue.

`docs/ROADMAP.md`'s "Outstanding: Production Migrations" section updated with this as ground truth in place of the blanket "unverified" note, with the confirmed action list: run `add-informal-jobs.sql`, then `add-training-levels.sql`, then `fix-application-visibility.sql`, then `create-avatar-bucket.sql`.

## Files changed
```
M  docs/ROADMAP.md
```
