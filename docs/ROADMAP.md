# Spanispace Development Roadmap

**Platform:** Talent Bridge for South African Job Seekers
**Founders:** Linda & Percy | **Location:** Gauteng, South Africa
**Mission:** Empower 100,000+ SA youth with job-ready skills and direct employment pathways by 2030
**Last Updated:** March 2026

---

## Current State (as of March 2026)

The platform is live on Netlify with a full Next.js 15 + React 19 + Supabase stack. Core infrastructure is production-ready.

### What's Built

| Area | Status | Details |
|------|--------|---------|
| Public site | ✅ Live | Home, Jobs, Training, Academic, Events, Legal pages |
| Auth system | ✅ Live | Supabase email/password auth, role-based routing |
| Candidate portal | ✅ Live | Dashboard, profile, applications, enrollments |
| Company portal | ✅ Live | Dashboard, job posting, candidate search, application mgmt |
| Admin panel | ✅ Live | Jobs, training, learnerships, late uni apps, applications |
| Database | ✅ Live | 13 tables, RLS policies, Supabase PostgreSQL |
| i18n | ✅ Live | English + isiZulu, 157+ strings |
| File uploads | ✅ Live | CV uploads via Supabase Storage |
| Legal | ✅ Live | POPIA-compliant Privacy Policy + SA Terms of Service |
| Waitlist | ✅ Live | Netlify Forms integration |

### Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend/DB:** Supabase (PostgreSQL + Auth + Storage + RLS)
- **Hosting:** Netlify
- **Forms:** Netlify Forms (zero-cost)
- **Validation:** react-hook-form + zod

---

## Roadmap

### Phase 1 — Growth & Retention (Q2 2026)
> Goal: Convert waitlist signups into active users. Reach 1,000 registered candidates.

#### 1.1 Email Notifications
- Application status updates (pending → shortlisted → hired/rejected)
- Event registration confirmations
- Learnership/deadline expiry alerts (7-day and 1-day warnings)
- Weekly digest of new jobs/learnerships matching candidate skills

**Tech:** Supabase Edge Functions + Resend or SendGrid

#### 1.2 Data Freshness System
- Admin tooling to bulk-update job/learnership expiry dates
- Automated flag for listings expiring within 7 days
- Weekly reminder to admin to refresh data (cron-based)
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
- Improve SEO: meta tags, OG images, structured data for job postings (Google Jobs schema)
- Add WhatsApp share button on job/learnership listings

---

### Phase 2 — Monetisation Foundation (Q3 2026)
> Goal: Onboard first 5–10 paying company clients. Validate revenue model.

#### 2.1 Company Subscription Payments
- Stripe integration for monthly billing
- Tier enforcement in middleware (Basic / Pro / Enterprise)
- Billing page in company portal (current plan, upgrade CTA, invoice history)
- Subscription status stored on `company_profiles.subscription_tier`

**Pricing (as designed):**
| Tier | Price | Access |
|------|-------|--------|
| Basic | R500–R1,000/mo | Job posts + limited pool access |
| Pro | R2,000–R5,000/mo | Full candidate search + analytics |
| Enterprise | Custom | Co-branded bootcamps + success fee (10–15% first-year salary) |

#### 2.2 Company Analytics Dashboard
- Candidate pipeline funnel (views → applied → shortlisted → hired)
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

### Phase 3 — Skills Verification Engine (Q3–Q4 2026)
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

### Phase 4 — AI Matching & Recommendations (Q4 2026)
> Goal: Reduce time candidates spend searching; surface the right opportunities automatically.

#### 4.1 Skills-Based Job Matching
- On login, candidates see "Recommended for you" section
- Match algorithm: candidate skills array vs job required skills (cosine similarity or OpenAI embeddings)
- Score shown as match percentage (e.g., "87% match")

**Tech:** OpenAI `text-embedding-3-small` + pgvector on Supabase

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

---

### Phase 5 — Communication & Scheduling (Q1 2027)
> Goal: Remove friction from the hiring process. Allow direct candidate–company contact within the platform.

#### 5.1 In-Platform Messaging
- Direct messages between company HR and candidate (post-shortlist only)
- Thread view in both candidate and company portals
- Email notification on new message

**Schema additions:** `messages`, `message_threads` tables

#### 5.2 Interview Scheduling
- Company proposes 3 time slots via calendar picker
- Candidate confirms preferred slot
- Both parties get calendar invite (iCal attachment via email)
- Integration with Google Calendar (stretch goal)

#### 5.3 Interview Simulator (Candidate Tool)
- AI-powered mock interview: candidate selects job type, gets questions, submits answers
- AI feedback on answer quality, structure (STAR method), and clarity
- Saves session history so candidate can review and improve

**Tech:** OpenAI Chat Completions API

#### 5.4 CV Builder
- Guided form: personal info, experience, education, skills, projects
- Template selection (1–3 clean SA-appropriate templates)
- Export as PDF
- Auto-populated from existing candidate profile data

---

### Phase 6 — Mobile App (Q2 2027)
> Goal: Reach candidates on mobile-first (majority of SA youth use mobile as primary device).

#### 6.1 React Native App (iOS + Android)
- Core screens: Home feed, Job Board, Apply, Profile, Notifications
- Push notifications for:
  - New matched jobs/learnerships
  - Application status changes
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

### Phase 7 — Community & Engagement (Q2–Q3 2027)
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
- Weekly manual update of learnerships and late university application deadlines
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
- POPIA compliance review as features are added (especially CV storage + messaging)
- Rate limiting on public API endpoints
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
| 1,000 registered candidates | Q2 2026 | Email notifications + Google auth live |
| First 5 paying companies | Q3 2026 | Stripe billing + company analytics |
| 100 verified badges issued | Q4 2026 | Assessment engine live |
| 10,000 registered candidates | Q4 2026 | AI matching + skills gap engine |
| Mobile app beta | Q2 2027 | React Native app on Play Store |
| 50,000 candidates | Q3 2027 | Community features + mentorship |
| 100,000 candidates | 2030 | Full platform maturity |
| Seed funding secured | Q2 2026 | SETA + tech firm partnerships |

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
