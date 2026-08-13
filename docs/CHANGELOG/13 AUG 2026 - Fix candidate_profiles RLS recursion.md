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
- New `supabase/fix-candidate-profile-visibility-recursion.sql` — run once in the Supabase Dashboard SQL Editor against the live project to replace the broken policy. **Not yet run in production** — the reported error will persist until this is applied.

## Files changed
```
M  supabase/schema.sql
A  supabase/fix-candidate-profile-visibility-recursion.sql
M  docs/ROADMAP.md
```
