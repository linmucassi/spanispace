# Spanispace Development Roadmap

**Platform:** Talent Bridge for South African Job Seekers
**Founders:** Linda & Percy | **Location:** Gauteng, South Africa
**Mission:** Empower 100,000+ SA youth with job-ready skills and direct employment pathways by 2030
**Last Updated:** 9 July 2026

---

## Current State (as of 9 July 2026)

The platform is live on Netlify with a full Next.js 16 + React 19 + Supabase stack. This audit found and fixed several load-bearing bugs in the company portal (applications never reaching the database, companies unable to read/edit their own closed jobs, company signup dead-ending at "Profile Not Found") and shipped the four company features named as priorities: job posting (already worked), job view/drop-off analytics, company-created events & training, and candidate↔company messaging. **All of this is code-complete and passes typecheck/lint/build, but six SQL migrations still need to be run against the production Supabase project before any of it is live** — see [Outstanding: Production Migrations](#outstanding-production-migrations) below.

### What's Built

| Area | Status | Details |
|------|--------|---------|
| Public site | ✅ Live | Home, Jobs, Training, Academic, Events, Legal pages |
| Auth system | ✅ Live | Supabase email/password auth, role-based routing, forgot/reset password |
| Candidate portal | ✅ Live | Dashboard, profile, multi-document library, applications, enrollments, AI CV audit, messages |
| Company portal | ✅ Live | Dashboard, job posting/editing, candidate search, applications, events, training, messages, profile |
| Admin panel | ✅ Live | Jobs, trainings, learnerships, late uni apps, applications, events (new), vetting queues |
| Database | ✅ Live | 19 tables, RLS policies, Supabase PostgreSQL |
| i18n | ✅ Live | English + isiZulu, 157+ strings |
| File uploads | ✅ Live | Multi-document library (CV, certificates, cover/motivational letters) via Supabase Storage |
| Legal | ✅ Live | POPIA-compliant Privacy Policy + SA Terms of Service |
| Waitlist | ✅ Live | Netlify Forms integration |
| Job/event auto-refresh | ✅ Live | Daily GitHub Actions scraper (RemoteOK, Remotive, Adzuna, Eventbrite → Supabase) — not previously documented |
| AI CV Audit | ✅ Live | Claude-powered CV review at `/candidate/cv-audit` — not previously documented |
| Mobile portal navigation | ✅ Live | All three portal sidebars (candidate/company/admin) now collapse to a hamburger drawer on mobile |
| Error boundaries | ✅ Live | `error.tsx` present for public, candidate, company, and admin sections |
| Loading skeletons | ✅ Live | Present on most dashboard/list routes across all portals |
| Job application pipeline | 🟢 Fixed, needs deploy | Public apply form only wrote to Netlify Forms, never to `applications` — company/candidate application views were always empty for real users. Fixed 9 Jul 2026; needs `supabase/fix-applications-pipeline.sql` run against production. |
| Company profile self-service | 🟢 Fixed, needs deploy | `company_profiles` had no INSERT RLS policy and the signup trigger never created the row — companies could get stuck at "Profile Not Found." Fixed 9 Jul 2026; needs `supabase/fix-company-profile-creation.sql`. |
| Company job management | 🟢 Fixed, needs deploy | `jobs` had no SELECT/UPDATE RLS policy for the owning company — closed/draft jobs didn't show in `/company/jobs`, and both Close/Reopen and Edit Job silently saved nothing. Fixed 9 Jul 2026; needs `supabase/fix-company-jobs-rls.sql`. |
| Job view / drop-off analytics | 🟢 Built, needs deploy | `job_views` + `application_starts` tables, instrumented on the job detail and apply pages, surfaced as a funnel on `/company/dashboard` and per-job columns on `/company/jobs`. Needs `supabase/add-job-analytics.sql`. |
| Company-created events & training | 🟢 Built, needs deploy | `/company/events` and `/company/training` (list/new/edit), submitted as `vetted_status = 'pending'` and reviewed via `/admin/trainings` and the new `/admin/events`. Needs `supabase/add-company-events-training.sql`. |
| Candidate ↔ company messaging | 🟢 Built, needs deploy | One thread per company↔candidate pair, inbox UI in both portals (`/company/messages`, `/candidate/messages`), entry points from candidate search and the applications list. Needs `supabase/add-messaging.sql`. |
| Email notifications | ❌ Not built | No Resend/SendGrid/Edge Function wiring found |
| Google OAuth | ❌ Not built | Email/password only |
| Payments (Stripe) | ❌ Not built | `subscription_tier`/`subscription_status` columns exist but are unused/manual |

### Outstanding: Production Migrations

Run these in the Supabase SQL Editor, in this order (each is idempotent / safe to re-run):

1. `supabase/fix-company-profile-creation.sql`
2. `supabase/fix-applications-pipeline.sql`
3. `supabase/fix-company-jobs-rls.sql`
4. `supabase/add-job-analytics.sql`
5. `supabase/add-company-events-training.sql`
6. `supabase/add-messaging.sql`

`supabase/schema.sql` has been updated to match, for anyone provisioning a fresh environment — it no longer needs any of the six patch files on top of it.

### Tech Stack

- **Frontend:** Next.js 16.1.6 (App Router), React 19.2.3, TypeScript, Tailwind CSS 4
- **Backend/DB:** Supabase (PostgreSQL + Auth + Storage + RLS)
- **AI:** Anthropic Claude (CV audit today; interview simulator/matching planned)
- **Hosting:** Netlify
- **Forms:** Netlify Forms (waitlist, newsletter — **not** job applications, see above)
- **Automation:** GitHub Actions daily scraper job (`.github/workflows/daily-scraper.yml`)
- **Validation:** react-hook-form + zod

---

## Immediate Priorities (Q3 2026) — code-complete 9 Jul 2026

> Goal: make the company portal trustworthy end-to-end before selling subscriptions on top of it. Company demand named four things explicitly: job posting, visibility into visits/drop-off, company-run events/training, and messaging with candidates — plus applications submitted, which turned out to be broken at the root. All five are now built; the only remaining step is running the migrations in [Outstanding: Production Migrations](#outstanding-production-migrations) against the live database.

#### 0.1 Fix the Application Pipeline — done
- `ApplyForm.tsx` now inserts into Supabase `applications` for real (DB-backed) jobs; the pre-existing Netlify Forms submission is kept as a best-effort duplicate notification, and remains the sole path for the static fallback job listings that have no `jobs` row to satisfy the foreign key
- Company/candidate application views now reflect real submissions instead of always being empty

#### 0.2 Deploy the Company Profile Fix — code done, migration pending
- `supabase/fix-company-profile-creation.sql` written; not yet run against production

#### 0.2b Fix Company Job Management RLS — code done, migration pending (found during this work)
- `jobs` had no SELECT/UPDATE policy for the owning company, so closed/draft jobs were invisible in `/company/jobs` and both Close/Reopen and Edit Job silently no-op'd under RLS. Fixed via `supabase/fix-company-jobs-rls.sql`

#### 0.3 Job View & Application Drop-Off Tracking — done
- `job_views` + `application_starts` tables, logged client-side (dedup'd per browser session) from the job detail page and the apply form
- `/company/dashboard` shows a views → started → submitted funnel with a completion rate; `/company/jobs` shows per-job Views/Started/Apps columns

#### 0.4 Company-Created Events & Training — done
- `trainings` and `events` both gained `company_id` + `vetted_status`; company submissions default to `pending` and are hidden from public listings until approved
- New company portal pages: `/company/events`, `/company/events/new`, `/company/events/[id]/edit`, `/company/training`, `/company/training/new`, `/company/training/[id]/edit`
- New admin vetting: `/admin/trainings` gained an approve/reject flow (mirroring jobs); `/admin/events` is a new page (none existed before — events were previously scraper-only)

#### 0.5 Candidate ↔ Company Messaging — done
- One thread per (company, candidate) pair (`message_threads` + `messages`), RLS-restricted to the two participants via a `is_thread_party`/`is_thread_participant` helper function pattern (mirrors the existing `is_admin()` approach)
- Shared inbox component (`components/messaging/MessagesInbox.tsx`) used by both `/company/messages` and `/candidate/messages`
- Entry points: "Message" from a candidate's profile card in `/company/candidates`, and from an application row in `/company/applications`
- Not enforced: the original roadmap idea of restricting company-initiated messages to shortlisted candidates only. Companies can currently message any candidate found via search or who applied. Revisit if this becomes a problem.

---

## Roadmap

### Phase 1 — Growth & Retention (Q3–Q4 2026)
> Goal: Convert waitlist signups into active users. Reach 1,000 registered candidates.

#### 1.1 Email Notifications
- Application status updates (pending → shortlisted → hired/rejected)
- New message notification (once 0.5 ships)
- Event registration confirmations
- Learnership/deadline expiry alerts (7-day and 1-day warnings)
- Weekly digest of new jobs/learnerships matching candidate skills

**Tech:** Supabase Edge Functions + Resend or SendGrid

#### 1.2 Data Freshness System
- The daily GitHub Actions scraper already auto-refreshes jobs (RemoteOK/Remotive/Adzuna) and events (Eventbrite) — this phase is about the parts it doesn't cover
- Admin tooling to bulk-update learnership expiry dates (learnerships/late-uni are still hand-curated)
- Automated flag for listings expiring within 7 days
- Public "Last Updated" timestamp on Jobs Board and Learnerships table

#### 1.3 Social Authentication
- Google OAuth (priority — most accessible for SA youth)
- Reduces registration friction significantly

**Tech:** Supabase Auth providers config

#### 1.4 Profile Completeness Nudges
- Candidate dashboard prompt when profile score < 70%
- Step-by-step onboarding checklist (add skills → upload CV → apply to first job)
- Email nudge after 48h if profile is incomplete

#### 1.5 Public Landing Page Improvements
- Add real learnership and late uni data (not seed data) — sourced weekly from SETA sites
- Add "Spanispace Verified" badge visual to job/learnership tables
- Improve SEO: meta tags, OG images, structured data for job postings (Google Jobs schema — JobPosting JSON-LD already implemented for job detail pages, extend to learnerships/trainings)
- Add WhatsApp share button on job/learnership listings

---

### Phase 2 — Monetisation Foundation (Q4 2026)
> Goal: Onboard first 5–10 paying company clients. Validate revenue model.

#### 2.1 Company Subscription Payments
- Stripe integration for monthly billing
- Tier enforcement in middleware (Basic / Pro / Enterprise)
- Billing page in company portal (current plan, upgrade CTA, invoice history)
- Subscription status stored on `company_profiles.subscription_tier` (column exists, currently unused — no billing logic reads or writes it yet)

**Pricing (as designed):**
| Tier | Price | Access |
|------|-------|--------|
| Basic | R500–R1,000/mo | Job posts + limited pool access |
| Pro | R2,000–R5,000/mo | Full candidate search + analytics |
| Enterprise | Custom | Co-branded bootcamps + success fee (10–15% first-year salary) |

#### 2.2 Company Analytics Dashboard
- Builds on the job view/drop-off tracking shipped in 0.3
- Candidate pipeline funnel (views → started → applied → shortlisted → hired)
- Time-to-hire metrics
- Skill gap analysis (what skills are candidates missing for their open roles)
- Export as PDF/CSV report

#### 2.3 Featured Job Listings
- Companies on Pro/Enterprise can pin a job to the top of public board
- "Spanispace Featured" badge on featured listings
- Rotation logic (fair display if multiple featured jobs active)

#### 2.4 Success Fee Tracking (Enterprise)
- Admin records "hire confirmed" event
- Triggers invoice generation for 10–15% success fee
- Simple hire confirmation flow in admin panel

---

### Phase 3 — Skills Verification Engine (Q4 2026–Q1 2027)
> Goal: Differentiate from LinkedIn/PNet with verified, project-based credentials.

#### 3.1 Skill Assessments
- Multiple-choice assessments per skill category (e.g., Excel, Python basics, AI prompting)
- Pass/fail threshold → auto-issue "Spanispace Verified" badge
- Badge stored on candidate profile, visible to companies
- Assessment questions managed by admin

**Schema additions:** `assessments`, `assessment_results`, `badges` tables

#### 3.2 Capstone Project Submission
- Candidate uploads project (GitHub link, ZIP, or hosted URL) per bootcamp
- Admin/mentor reviews and approves
- Approved projects display on public candidate portfolio page

#### 3.3 Public Candidate Portfolio Page
- `/candidates/:id` — public URL candidates can share
- Shows: verified badges, completed projects, skills, work experience
- Optional: GitHub activity embed
- Replaces the need for a standalone portfolio site for most candidates

#### 3.4 Badge Verification API
- Public endpoint: `GET /api/verify/badge/:id` returns badge validity
- Useful for employers to verify without logging in
- QR code on candidate profile linking to verification URL

---

### Phase 4 — AI Matching & Recommendations (Q1 2027)
> Goal: Reduce time candidates spend searching; surface the right opportunities automatically. The platform already has a working Claude integration (CV audit) to build on.

#### 4.1 Skills-Based Job Matching
- On login, candidates see "Recommended for you" section
- Match algorithm: candidate skills array vs job required skills (cosine similarity or embeddings)
- Score shown as match percentage (e.g., "87% match")

**Tech:** Embeddings + pgvector on Supabase

#### 4.2 Skills Gap Recommendations
- After applying to a job, show: "You're missing these 2 skills — here's a short course"
- Link directly to relevant training in the platform
- Personalised dashboard section: "Your next skill to unlock more jobs"

#### 4.3 Smart Learnership Matching
- Filter learnerships by candidate's completed education level (Matric / Diploma / Degree)
- Surface learnerships closing soon that match candidate interests
- Push alert (email + in-app) for high-match learnerships expiring in < 14 days

#### 4.4 Employer Candidate Recommendations
- When company posts a job, auto-surface top 10 matching candidates in their dashboard
- "Recommended Candidates" tab on company jobs view

#### 4.5 AI Interview Simulator (Candidate Tool)
- Extends the existing Claude CV-audit integration to mock interviews: candidate selects job type, gets questions, submits answers
- AI feedback on answer quality, structure (STAR method), and clarity
- Saves session history so candidate can review and improve

---

### Phase 5 — Scheduling & CV Tools (Q2 2027)
> Goal: Remove remaining friction from the hiring process. Messaging itself moved up to [Immediate Priorities](#immediate-priorities--q3-2026) (0.5) given direct company demand.

#### 5.1 Interview Scheduling
- Company proposes 3 time slots via calendar picker
- Candidate confirms preferred slot
- Both parties get calendar invite (iCal attachment via email)
- Integration with Google Calendar (stretch goal)

#### 5.2 CV Builder
- Guided form: personal info, experience, education, skills, projects
- Template selection (1–3 clean SA-appropriate templates)
- Export as PDF
- Auto-populated from existing candidate profile data

---

### Phase 6 — Mobile App (Q3 2027)
> Goal: Reach candidates on mobile-first (majority of SA youth use mobile as primary device).

#### 6.1 React Native App (iOS + Android)
- Core screens: Home feed, Job Board, Apply, Profile, Notifications
- Push notifications for:
  - New matched jobs/learnerships
  - Application status changes
  - New messages
  - Upcoming events
  - Expiry alerts
- Login with Google (priority) + email

#### 6.2 Offline Capability
- Cache job/learnership listings for offline browsing
- Draft application saved locally, submitted when back online

#### 6.3 App Store Launch
- Google Play Store (priority — Android dominant in SA)
- Apple App Store

---

### Phase 7 — Community & Engagement (Q4 2027)
> Goal: Build a sticky platform that candidates return to, not just a job board.

#### 7.1 Hackathons & Community Events
- Admin creates hackathon/challenge events with submissions
- Candidates submit projects, winners get featured + badge
- Company sponsors visible on event page

#### 7.2 Mentorship Programme
- Mentors (vetted professionals) register on platform
- Candidates request mentorship (1 session, topic-specific)
- Simple booking flow + video call link (Zoom/Google Meet)
- Mentor profiles visible to Pro/Enterprise company subscribers

#### 7.3 Cohort-Based Bootcamps
- Live cohort with start/end date, enrolled candidates grouped together
- Progress tracker per cohort
- Peer discussion board per bootcamp

#### 7.4 Employer Branding Pages
- `/companies/:slug` — public employer profile
- Showcases culture, open roles, past hires, testimonials from placed candidates
- Available to Pro/Enterprise subscribers

---

## Non-Feature Work (Ongoing)

### Data Operations
- Daily scraper (GitHub Actions) auto-refreshes jobs and events — monitor its run logs, not just manual curation
- Weekly manual update of learnerships and late university application deadlines (not yet automated)
- Monthly audit of expired jobs — archive or remove
- Monitor SETA sites (INSETA, MerSETA, ETDP SETA) for new learnerships
- Track university late application windows (UCT, Wits, UP, UJ, UNISA)

### Growth & Marketing
- WhatsApp community (Gauteng schools + TVET colleges)
- X/Twitter presence with weekly "New Learnerships" thread
- Partnership outreach: SETA bodies, NSFAS, Harambee Youth Employment
- School/university career centre partnerships

### Security & Compliance
- Regular dependency updates (npm audit)
- POPIA compliance review as features are added (especially messaging, now scheduled for 0.5)
- Rate limiting on public API endpoints (job posting, applications, cv-audit)
- Input sanitisation audit before messaging goes live

### Infrastructure
- Set up staging environment (separate Supabase project + Netlify preview)
- Monitoring: Uptime Robot or BetterStack for availability alerts
- Error tracking: Sentry integration
- Performance: Lighthouse audits quarterly, target score > 90

---

## Milestone Summary

| Milestone | Target | Key Deliverable |
|-----------|--------|-----------------|
| Application pipeline fixed + company profile fix deployed | Q3 2026 | `applications` table reflects real submissions; no company stuck at signup |
| Company visibility & self-service parity | Q3 2026 | Job view/drop-off analytics, company-created events/training, messaging live |
| 1,000 registered candidates | Q3–Q4 2026 | Email notifications + Google auth live |
| First 5 paying companies | Q4 2026 | Stripe billing + company analytics |
| 100 verified badges issued | Q1 2027 | Assessment engine live |
| 10,000 registered candidates | Q1 2027 | AI matching + skills gap engine |
| Mobile app beta | Q3 2027 | React Native app on Play Store |
| 50,000 candidates | Q4 2027 | Community features + mentorship |
| 100,000 candidates | 2030 | Full platform maturity |
| Seed funding secured | Q3 2026 | SETA + tech firm partnerships |

---

## Backlog (Unscoped / Future Consideration)

- LinkedIn profile import (auto-populate candidate profile)
- Video intro on candidate profile (30-second pitch)
- Referral programme (candidates invite friends → earn platform credits)
- Diversity & inclusion analytics for companies (EE reporting)
- Government/SETA API integration for automated learnership data
- Employer NPS surveys post-hire
- Alumni network (past candidates who got hired — success stories feed)
- Placement guarantee track ("Job-ready in 6 months or your bootcamp is free")
- Multi-language expansion: Sesotho, Afrikaans, isiXhosa
