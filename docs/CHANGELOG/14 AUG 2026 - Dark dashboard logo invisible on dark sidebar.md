# 14 Aug 2026

## Fix: dashboard sidebar logo invisible (dark logo on dark background)

User report: the logo in the dashboard sidebars looked wrong — dark logo on the dark sidebar background.

`components/candidate/CandidateSidebar.tsx`, `components/company/CompanySidebar.tsx`, and `components/admin/AdminSidebar.tsx` all render the sidebar on `bg-slate-900`. Each file's own mobile top bar, and `components/Footer.tsx`, already render `logo-wordmark.png` (a dark wordmark) as white via `brightness-0 invert` CSS filter classes — there's no separate white logo asset, just this filter. The desktop sidebar's logo (`h-10 w-auto`, no filter) was missing those two classes in all three sidebars, so it rendered dark-on-dark and was effectively invisible. Added `brightness-0 invert` to match the existing mobile/footer usage in all three files.
