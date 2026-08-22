# 22 Aug 2026

## Fix (needs production SQL run): every candidate signup fails with "Database error saving new user"

Report from Linda: "Almost anyone I try to tell to get on the sight via Google email it does this... 'Database error saving new user.'"

Reproduced directly against the live database (`rssuacaedvihhpcakuvm`) using the service-role admin API with throwaway test accounts, rather than guessing from the SQL files — this repo's `supabase/*.sql` migrations are run manually in the Supabase SQL Editor, so what's actually live can drift from what's in git:

- `supabase.auth.admin.createUser()` with `role: 'company'` metadata → succeeds.
- The same call with `role: 'candidate'`, or with no `role` at all → fails every time, 100%, even with a fully-formed name/phone/location matching exactly what the register form or Google sign-in would send.

Google sign-in (`lib/auth/useGoogleSignIn.ts`, `signInWithIdToken`) never sets a `role` in user metadata at all, so it always takes the candidate branch — which is why this looked Google-specific to Linda. It isn't: the email/password candidate tab on `/register` sends `role: 'candidate'` explicitly and hits the identical bug. Company signups were untouched by luck of table structure, not because anything company-specific was fixed.

**Root cause:** `supabase/schema.sql`'s `handle_new_user()` trigger function was edited on 13 Aug 2026 (commit `dde2dbc`) and lost the `SET search_path = public` clause that `supabase/fix-security-hardening.sql` (8 Aug 2026) had added — along with that same migration's signup-role allowlist (reopening the admin-role-escalation hole tracked as issue #8, a separate but related regression). `handle_new_user()` is `SECURITY DEFINER`, invoked by Supabase's `supabase_auth_admin` role, whose own `search_path` deliberately excludes `public` (a Supabase hardening default, to stop search_path-hijacking attacks). Company signups insert only into `company_profiles`, which has no trigger of its own, so the missing search_path was invisible there. Candidate signups insert into `candidate_profiles`, which fires the `compute_profile_score()` `BEFORE INSERT` trigger (`supabase/fix-cv-completeness.sql`) — and that function does an unqualified `SELECT ... FROM candidate_documents`, which fails to resolve without `public` on the path, throwing an error that aborts the whole `auth.users` insert transaction. That's the exact and only difference between the two paths; isolated by testing a direct `candidate_profiles` insert via the service-role client (which has a normal search_path) — that succeeded and computed the score correctly, proving `compute_profile_score()` itself is fine and the bug is specifically the missing search_path on the trigger that invokes it.

**Fixed:**
- `supabase/schema.sql` — restored both the `SET search_path = public` clause and the `fix-security-hardening.sql` role allowlist (`safe_role`, only `'company'` passes through, everything else including `'admin'` collapses to `'candidate'`) on `handle_new_user()`, so a future full-schema run doesn't reintroduce either regression.
- New `supabase/fix-candidate-signup-search-path.sql` — the corrected function definition, safe to run standalone and idempotent. **Still needs to be run in the Supabase SQL Editor against production** — not achievable from application code, this is a database trigger fix.

All diagnostic test accounts (both the ones that succeeded and the ones that failed) were created and deleted via the service-role admin API during investigation; nothing left behind in the live database.

**You still need to:** run `supabase/fix-candidate-signup-search-path.sql` in the Supabase SQL Editor. Until that happens, no one can create a candidate account on the live site by any signup path.

Also added the Röhlig-Grindrod YES Programme 2027 learnership (5 locations, Gauteng/Eastern Cape/Western Cape/Durban, merged into one listing since the schema has no multi-location support; expiry set to the earliest of the five closing dates, 26 Aug 2026, so candidates aren't misled about locations that close sooner).

## Files changed
```
A  supabase/fix-candidate-signup-search-path.sql
M  supabase/schema.sql
M  docs/ROADMAP.md
```
