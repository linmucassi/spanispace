# 14 Aug 2026

## Add: job title/keyword search on the public jobs board

User report: no way to search for a specific kind of job (e.g. "Pharmacy" / "pharmacist") on `/jobs` — only a job-type dropdown (Full-time, Remote, Learnership, etc.) and a South-Africa-only location toggle existed, neither of which filters by role.

Checked the `jobs` schema first in case "Pharmacy" should map to a category: there is no `category` column on `jobs`, only `job_type` (a fixed CHECK-constrained enum of employment arrangements). The `category` field that does exist in `types.ts` (`Bootcamp` / `Short Course` / `Event`) belongs to Trainings, unrelated to jobs. So free-text search against the job title was the only fit — not a new category to add.

Added a text input to `components/JobBoard.tsx`, alongside the existing two `<select>` filters. Filtering stays client-side (the board already receives the full page of jobs as `initialJobs` from `lib/publicJobs.ts`'s `fetchPublicJobs()` — no server-side query changes needed): case-insensitive substring match against `job.role` and `job.company`, combined with the existing type/location filters (all three now AND together), resets to page 1 on change like the other filters. New i18n key `jobs.searchPlaceholder` in both `lib/i18n/en.ts` and `lib/i18n/zu.ts`.
