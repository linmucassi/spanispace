# Spanispace: Project Details

**Last updated:** 20 October 2026
**Founders:** Linda & Percy | **Location:** Gauteng, South Africa
**Live site:** spanispace.com (Netlify) | **Repo:** `linmucassi/spanispace`

This document explains what Spanispace is, who it serves, how it is built, and where it is going. It also specifies the next major feature, **Spanispace Services**, a marketplace for verified, short-term service work. Day-to-day status lives in [ROADMAP.md](ROADMAP.md), and the history of each change lives in [CHANGELOG/](CHANGELOG/).

---

## 1. Overview

Spanispace is a South African career and work platform. It connects people looking for work with the organisations and individuals who need them, and it gives job seekers the tools to become employable: training, verified credentials, CV help and application tracking.

The platform currently has three portals:

| Portal | Who | What they do |
|--------|-----|--------------|
| **Candidate** | Job seekers, learners, students, informal and piece-job workers | Build a profile (education, work history including informal work, documents, skills), apply for jobs and learnerships, get matched through auto-apply, take SpaniSpace Academy courses, get document-verified, message companies, manage interviews on a calendar |
| **Company** | Employers, multi-user organisations | Post and manage jobs, see view/drop-off analytics, search the talent pool, invite candidates, run events and training, message candidates, schedule interviews, manage a team with roles (Owner/Admin/Manager/Member/Viewer) |
| **Admin** | Spanispace staff (Super Admin / Platform Admin) | Vet jobs, events, trainings and companies, verify candidate documents, manage users and invites, review scraped and curated listings |

The public site is open to everyone and offers a jobs board (company-posted, admin-curated and scraped listings), learnerships, events, a training catalogue, and late university/college applications. It is available in English and isiZulu (isiZulu is in beta).

## 2. The problem

- **Youth unemployment in South Africa is very high.** Many young people have skills, informal experience or the will to learn, but no route to an employer who can see that.
- **Informal and piece work is invisible.** Someone who has painted houses, done laundry or fixed plumbing for years usually has no CV that reflects it, and no trusted channel to find the next job.
- **Trust is the bottleneck on both sides.** Employers and households worry about fraud and safety. Workers worry about fake job posts and not being paid.
- **Opportunities are scattered** across job boards, SETA sites, university portals and WhatsApp groups.

## 3. Mission and goals

**Mission:** empower 100,000+ South African youth with job-ready skills and direct employment pathways by 2030.

| Goal | How Spanispace delivers it |
|------|----------------------------|
| One place for opportunities | Unified board of jobs, learnerships, events, training and university applications, refreshed daily by scrapers |
| Make every kind of work count | Informal and piece work recorded as real work history, AI-built professional summaries |
| Trust by default | Vetted companies and listings, verified candidate documents, an admin review step for anything public |
| Job readiness | SpaniSpace Academy courses, AI CV audit, CV autofill, profile-completeness nudges |
| Sustainable business | Company subscriptions, featured listings, success fees and (new) service booking fees, so the platform can stay free for job seekers |

### Milestones

See the [Milestone Summary in ROADMAP.md](ROADMAP.md#milestone-summary). Headline targets: 1,000 candidates and the first 5 paying companies in Q4 2026, 10,000 candidates in Q1 2027, a mobile app beta in Q3 2027, 100,000 candidates by 2030.

## 4. Business model

| Revenue stream | Status |
|----------------|--------|
| Company subscriptions (Basic R500–R1,000/mo, Pro R2,000–R5,000/mo, Enterprise custom) | Designed, not built (Phase 2.1) |
| Featured job listings | Designed, not built (Phase 2.3) |
| Enterprise success fee (10–15% of first-year salary) | Designed, not built (Phase 2.4) |
| Paid training levels (Advanced courses) | Catalogue built, payments not built |
| **Service booking fee (Spanispace Services)** | **New, specified below** |

Job seekers never pay to apply for jobs.

## 5. Technology

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Row Level Security). Access rules live in RLS policies and `SECURITY DEFINER` helpers (`is_admin()`, `is_thread_participant()`, `company_has_applicant()` and others)
- **AI:** Google Gemini for the CV audit, profile summaries and CV autofill
- **Email:** Resend through `lib/email.ts` (outbox table plus a GitHub Actions cron)
- **Automation:** GitHub Actions daily scraper (RemoteOK, Remotive, Adzuna, Eventbrite), auto-apply matcher, profile nudges
- **Hosting:** Netlify (`@netlify/plugin-nextjs`)
- **Branches:** feature branches → `staging` (default) → `main`, both protected, CI runs a typecheck and build on PRs
- **Schema:** `supabase/schema.sql` is the fresh-install baseline. Every change ships as a standalone migration file in `supabase/`

## 6. Trust, safety and compliance

Spanispace operates under **POPIA** (privacy), the **CPA** (consumer protection: fees, refunds, misleading claims) and the **ECT Act** (online transactions, business disclosure). The 20-item compliance checklist in [ROADMAP.md](ROADMAP.md#legal--compliance-checklist-added-15-oct-2026) tracks the open items: signup consent, an age check, account deletion, an unsubscribe link, a refund policy and business details. Spanispace Services raises the stakes on several of them (see §7.9), because it adds payments and criminal-record checks.

---

## 7. New feature: Spanispace Services

### 7.1 Summary

A marketplace where verified individuals offer **short-term, everyday services**, such as cleaning, laundry, painting, plumbing, gardening, electrical work, moving help, childminding and handyman jobs. A typical job lasts one day or a few days. These people are not looking for employment at a company. They want to be hired for a job and paid for it.

Any user can search for a provider, find one and hire them. Spanispace earns a **booking fee charged to the person hiring**, which is separate from the provider's own service charge. The fee is charged **only once both parties agree to a job**. To protect that fee and keep both sides safe, all contact happens through Spanispace messaging, and phone numbers and email addresses are **blocked until the agreement is reached and the fee is paid**.

### 7.2 Who is involved

| Role | Description |
|------|-------------|
| **Service Provider** | A person offering services. They either sign up as a new provider, or opt in from an existing candidate account. A provider can stay a normal candidate too, applying for jobs with the same profile. |
| **Requester** | Anyone hiring a provider: a household, a candidate, a company, or a member of the public with an account. A requester must be signed in to message or hire, and pays the booking fee. |
| **Admin** | Reviews provider enrolments and verification documents, handles disputes, reports and refunds. |

One account can hold several roles. A candidate can also be a provider, and a provider can also be a requester. Being a provider is a **capability added to an account**. It does not replace the account's role, so we do not need a fourth value in `users.role`. A provider record is added alongside `candidate_profiles`.

### 7.3 Provider journey

```
Sign up (new)  ─┐
                ├─► Enrolment ─► Verification ─► Terms acceptance ─► Listing live ─► Receive requests
Candidate opt-in┘   (profile)     (admin review)   (provider agreement)
```

1. **Entry**
   - **New signup:** the register page gets a third option, "Offer services", next to Candidate and Company. Behind the scenes it creates a candidate account plus a provider record.
   - **Opt-in:** a candidate clicks "Offer my services" from the dashboard or profile. Their existing name, phone, avatar, skills and work history carry over.
2. **Enrolment (service profile)**
   - Service categories (from a fixed list, several allowed), with a short description and years of experience for each
   - Service area: province, city or suburb, and travel radius
   - Rates: how they charge (per hour, per day, per job or quote-based) and an indicative price range in ZAR. This is for display only, and the final price is agreed in the chat
   - Availability: days and times
   - Portfolio photos of past work (optional)
   - Tools or equipment they bring (optional)
   - **No contact details anywhere on the public profile.** The profile fields reject phone numbers, emails, links and social handles, using the same detector as messaging (§7.6)
3. **Verification.** This is required before a listing goes live, and is the same idea as company vetting. Status moves `pending` → `verified` / `rejected` / `suspended`.
   - SA ID document or passport plus a valid work permit (reuses `candidate_documents` with `id_document`)
   - A selfie or liveness photo, matched to the ID by an admin
   - **A criminal record check:** a SAPS Police Clearance Certificate uploaded by the provider, or later a third-party background check API
   - Proof of address
   - Trade qualifications where the category needs them. Electrical work needs a wireman's licence or Certificate of Compliance ability, and gas needs SAQCC registration. Plumbing should be PIRB-registered for compliance work
   - Optional references from past clients
   - Reviewed by an admin at a new `/admin/service-providers` queue. Requesters never see the raw documents, only a "Verified" or "Police-cleared" badge, which is the same rule as candidate verification today
   - Re-verification: police clearance expires after a set period (proposed 12 months), and the badge drops off when it does
4. **Terms acceptance.** Before going live the provider must accept a **Service Provider Agreement**, which covers:
   - The platform fee model, and that it is charged to the requester
   - **No off-platform contact or payment circumvention.** No sharing of contact details before an agreement, and no asking clients to "book direct" to avoid the fee. Breaches lead to a warning, then suspension, then removal
   - Conduct, safety, and honest representation of skills and qualifications
   - That the provider is an independent contractor, not an employee of Spanispace or the requester
   - Consent to verification, including processing criminal-record information (POPIA §26 special personal information, which needs explicit consent)
   - The agreement version and timestamp are stored per provider, and they must re-accept when the terms change
5. **Live.** The listing appears in search, and the provider receives requests in their inbox.

### 7.4 Requester journey

1. **Search and browse.** This is public, so visitors without an account can browse. Filters: category, location or distance, availability date, price range, rating, verified only. Search results show the provider's first name and last initial, photo, categories, area, rate range, rating, badges and completed-job count.
2. **Request.** A signed-in requester opens a chat from the provider's profile, with the job details prefilled: category, address area (suburb only at this stage), date(s) and a description.
3. **Negotiate in chat.** The two discuss scope and price. Contact details are blocked (§7.6).
4. **Agreement.** The provider sends a structured **Offer** in the chat (scope, date(s), service price, what's included). The requester sees the service price and the **Spanispace booking fee as separate lines** and accepts. Either side can send a revised offer, and only the latest offer is acceptable.
5. **Pay the booking fee.** The requester pays only the Spanispace fee through the payment provider. The booking becomes `confirmed` only after the payment webhook succeeds.
6. **Unlock.** Once confirmed, the chat unlocks. Both parties can share phone numbers, and the platform shows both parties' verified phone numbers and the full job address.
7. **Do the job, then pay the provider.** The service charge goes directly to the provider, in cash or EFT, in v1 (see §7.7 for a future escrow option).
8. **Complete and review.** Either party marks the job complete, and both leave a rating and review. Reviews are only allowed on confirmed bookings, which prevents fake reviews (CPA, and checklist item 11).

### 7.5 Booking lifecycle

```
enquiry ─► offer_sent ─► offer_accepted ─► fee_pending ─► confirmed ─► in_progress ─► completed
                │               │                │             │
                ▼               ▼                ▼             ▼
            declined        expired*        payment_failed  cancelled / disputed
```

`*` An accepted offer that isn't paid within a set window (proposed 48 hours) expires, and the provider is free to take other work.

### 7.6 Contact-detail blocking

This is the core technical requirement. Until a booking is `confirmed` (fee paid) for that thread, no message may contain contact details or routes to off-platform contact.

**What gets blocked:**
- Phone numbers in any format: `0821234567`, `082 123 4567`, `+27 82 123 4567`, `27821234567`, `(082) 123-4567`, separators such as `.`, `-`, `/` and spaces
- Obfuscated numbers: digits written as words ("zero eight two…"), in isiZulu or mixed, or digits split across words ("o8two") or across several consecutive messages
- Email addresses, including obfuscated ones ("name at gmail dot com", "name[at]gmail")
- Links and handles: URLs, `wa.me`, WhatsApp/Telegram/Signal invites, `@instagram` handles, "find me on Facebook as…"
- Phrases that ask to move off-platform ("WhatsApp me", "call me", "send your number", "pay me direct")
- Images and attachments, which are not allowed in pre-agreement chats in v1, since a photo of a number gets past text filters. Portfolio photos are reviewed at enrolment instead

**How it's enforced (server-side, never client-only):**
- Today, `components/messaging/MessagesInbox.tsx` inserts into `messages` straight from the browser, so client checks alone can be bypassed. For service threads:
  - Messages go through an API route (`POST /api/services/messages`) or a database `BEFORE INSERT` trigger that runs the detector. The RLS INSERT policy for service threads denies direct client inserts.
  - The detector lives in one shared module, `lib/services/contactGuard.ts`, used by the API, profile validation and the client (as a live warning while typing).
  - It normalises text first: number-words to digits, look-alike letters (`o`→`0`, `l`→`1`), removed separators. It also checks a rolling window of the sender's last few messages, to catch numbers split across messages.
- Behaviour on a match: the message is **not delivered**. The sender sees "Contact details can be shared once the booking is confirmed", and the attempt is logged in `contact_violations`. Repeated attempts flag the account for admin review and can trigger automatic suspension.
- After `confirmed`, the guard is switched off for that thread only. The thread stays on-platform for the record, and for disputes.
- Admins can read service threads when a dispute or report is raised. This must be disclosed in the privacy policy and the terms.

### 7.7 Fees and payments

- **The Spanispace booking fee is a flat R10 per booking** (decided 20 Oct 2026). It is the same for every category and every service price, and it is charged to the requester. It is separate from the provider's service price, which Spanispace never touches in v1.
  - Store the fee in one config value (`SERVICE_BOOKING_FEE_CENTS = 1000`), and copy it onto each booking as `platform_fee` when the offer is accepted. Changing the fee later then never rewrites past bookings.
  - **Company bookings** pay R10 per provider booked (see §7.13).
- Fees are shown in ZAR, VAT-inclusive if Spanispace is VAT-registered, **before** the requester accepts the offer (CPA, and checklist item 10).
- Charged only after both parties have agreed, on offer acceptance. There is no charge for enquiries or browsing.
- **Payment gateway: none exists yet** (decided 20 Oct 2026). Choosing and integrating one is step S4.0 of the plan, and the same gateway will later serve company subscriptions (Phase 2.1). Requirements:
  - card and instant EFT
  - signed webhooks
  - refunds through the API
  - a sandbox
  - South African settlement in ZAR
  - **low fixed per-transaction fees.** With a R10 fee, a fixed charge of R1–R2 plus a percentage takes a large share of every booking. Compare the gateways on the real cost of a R10 charge before choosing.

  Candidates are Paystack, PayFast, Peach Payments and Yoco. Recommendation: **Paystack**, for its API, webhooks and documentation quality, unless the cost comparison on a R10 charge clearly favours another. A later option is prepaid credit bundles (for example R50 for 5 bookings), which cut the per-transaction overhead.
- **v2 option, escrow:** the requester pays service price plus fee into the platform. Spanispace releases the payout to the provider on completion, minus the fee. This protects both sides better, but makes Spanispace a payment intermediary, so it needs a gateway with split or marketplace payouts and more compliance work. Out of scope for v1.

### 7.7a Cancellation and refund policy (v1)

The R10 fee pays for a **confirmed, contact-unlocked booking**, and that is delivered the moment the payment clears. Refunding a requester after the unlock would let anyone pay, take the number, cancel and then book the provider directly. So refunds depend on who caused the cancellation.

| # | Situation | Outcome |
|---|-----------|---------|
| 1 | Either party cancels **before the fee is paid** (enquiry, offer sent, offer accepted but unpaid) | Free. Nothing is charged |
| 2 | An accepted offer is **not paid within 48 hours** | The offer expires, there is no charge, and the provider is free to take other work |
| 3 | The **provider cancels** after the fee is paid | **Full refund** to the original payment method. The provider gets a reliability strike |
| 4 | The **provider doesn't show up** (requester reports it within 48 hours of the start time, and an admin confirms it) | **Full refund**. The provider gets a strike |
| 5 | The provider is **suspended or loses verification** before the job date | **Full refund**. The requester is told and helped to find another provider |
| 6 | The **requester cancels** after paying, **more than 24 hours before the start** | No cash refund. A **R10 booking credit** for a future booking, at most one per 30 days, valid for 12 months |
| 7 | The **requester cancels within 24 hours** of the start, or doesn't show up | No refund, no credit |
| 8 | **Duplicate charge, failed booking or a technical error** by Spanispace | **Full refund**, always |
| 9 | **Dispute over quality or the service price** (job done badly, a price disagreement) | Spanispace is not a party to the service contract (§7.14). Refunding the R10 fee is at admin discretion, and the service price is between the two parties. Spanispace may warn or suspend the provider |
| 10 | Provider **strikes**: 3 strikes in 90 days | Listing paused automatically, pending admin review |

- **Timelines:** cash refunds are issued within 7 business days, through the gateway's refund API. Credits are applied automatically at the next checkout.
- **Company bookings:** the same rules, but a refund is issued as a credit note against the company's invoice (§7.13).
- **Cooling-off (ECT Act s44):** the unlock is delivered immediately, with the requester's consent. The checkout must therefore carry an explicit tick box: "I understand my contact details unlock immediately and the booking fee is non-refundable except as set out in the cancellation policy". **Have a lawyer confirm** that the ECT s42 exclusion for services started with consent covers this before launch.
- The policy is published at `/services/cancellation-policy`, linked from checkout, the terms and every booking receipt. This also closes compliance checklist item 3 for Services.

### 7.8 Proposed data model

New migration: `supabase/add-service-marketplace.sql`.

| Table | Purpose / key columns |
|-------|-----------------------|
| `service_categories` | `id`, `slug`, `name`, `requires_qualification` (bool), `active` |
| `service_providers` | `id`, `user_id` (unique, references `users`), `candidate_profile_id`, `headline`, `bio`, `service_area` (province/city/suburb), `travel_radius_km`, `availability` (jsonb), `verification_status` (`pending`/`verified`/`rejected`/`suspended`), `police_clearance_expires_at`, `terms_version`, `terms_accepted_at`, `listing_active`, `rating_avg`, `jobs_completed` |
| `provider_services` | `provider_id`, `category_id`, `pricing_unit` (`hour`/`day`/`job`/`quote`), `price_min`, `price_max`, `years_experience`, `description` |
| `provider_documents` | Or extend `candidate_documents.document_type` with `police_clearance`, `proof_of_address`, `trade_certificate`, `selfie` |
| `service_threads` | `id`, `provider_id`, `requester_user_id`, `category_id`, `status`, `contact_unlocked` (bool, set only by the payment webhook), `created_at`. Kept separate from `message_threads`, which is fixed to company↔candidate pairs, so the existing RLS stays untouched |
| `service_messages` | `id`, `thread_id`, `sender_id`, `body`, `kind` (`text`/`offer`/`system`), `blocked` (bool), `created_at` |
| `service_bookings` | `id`, `thread_id`, `offer_message_id`, `scope`, `start_date`, `end_date`, `service_price`, `platform_fee`, `status` (see §7.5), `payment_reference`, `paid_at`, `completed_at`, `cancelled_by`, `cancel_reason` |
| `service_reviews` | `booking_id` (unique per reviewer), `reviewer_id`, `reviewee_id`, `rating` 1–5, `comment` |
| `contact_violations` | `id`, `user_id`, `thread_id`, `matched_pattern`, `created_at` (append-only, admin-read) |
| `service_reports` | User reports of safety issues and disputes: `booking_id`/`thread_id`, `reporter_id`, `reason`, `status` |
| `service_jobs` | Company jobs only: `id`, `company_id`, `title`, `site_address`, `site_contact_name`/`phone`, `po_reference`, `recurrence` (none/weekly/monthly), `created_by`. Groups several `service_bookings` |
| `service_payments` | One row per gateway charge or refund: `booking_id`, `gateway`, `gateway_reference`, `amount_cents`, `kind` (`charge`/`refund`), `status`, raw webhook payload. Also an idempotency key, so a webhook replay never double-confirms |
| `service_credits` | R10 rebooking credits (§7.7a rule 6): `user_id`, `amount_cents`, `source_booking_id`, `expires_at`, `used_on_booking_id` |
| `provider_strikes` | `provider_id`, `booking_id`, `reason` (`provider_cancel`/`no_show`/`conduct`), `created_at`. 3 strikes in 90 days pauses the listing |

`service_threads` and `service_bookings` also carry a nullable `company_id` and `service_job_id` for company hiring (§7.13). `service_bookings` stores `terms_accepted_at` and `disclaimer_accepted_at`, the checkout tick boxes.

RLS rules to apply:
- Only verified, active providers appear in public search.
- Thread and message reads are limited to the two parties plus admins, using a new `is_service_thread_party()` `SECURITY DEFINER` helper (the same pattern as `is_thread_participant()`).
- `contact_unlocked`, `service_bookings.status = 'confirmed'` and `paid_at` are writable only by the service role (the payment webhook), never by either party.
- Documents and `contact_violations` are admin-only.

### 7.9 Compliance impact

| Area | Requirement |
|------|-------------|
| POPIA §26–27 | Criminal-record data is special personal information. It needs explicit consent, strict admin-only access, and a defined retention period. Proposed: keep the verification outcome and delete the certificate file after review, or after N months |
| POPIA, privacy policy | Disclose message scanning for contact details and admin access to service threads during disputes. Name the payment provider as a processor |
| CPA | Show fees upfront and inclusive of VAT, publish a refund and cancellation policy, allow only genuine reviews, and avoid misleading "verified" claims (the badge must say what was checked) |
| ECT Act s43–44 | Business details on the site, cooling-off and refund terms for online payments |
| Age | Providers must be 18 or older (enforced at enrolment from ID). This links to checklist item 17 |
| Labour | Terms state providers are independent contractors, and that Spanispace is a marketplace, not an employer or labour broker |
| Safety | In-app report button, a published safety guide for both sides, and the ability to suspend instantly |

### 7.10 Pages and routes (proposed)

| Route | Purpose |
|-------|---------|
| `/services` | Public browse and search |
| `/services/[category]` | Category landing page (good for SEO) |
| `/services/provider/[id]` | Public provider profile, with no contact details |
| `/candidate/services/enrol` | Provider enrolment wizard (opt-in or new signup) |
| `/candidate/services` | Provider dashboard: listing, verification status, bookings, earnings history |
| `/services/messages` | Service inbox for both providers and requesters |
| `/services/bookings` | A requester's bookings and receipts |
| `/admin/service-providers` | Verification queue |
| `/admin/service-reports` | Disputes, reports and contact-violation review |
| `POST /api/services/messages` | Guarded message send |
| `POST /api/services/bookings/[id]/pay` | Start the fee payment |
| `POST /api/services/webhook` | Payment provider webhook, the only thing that confirms a booking and unlocks contact |

### 7.11 Delivery phases

The full step-by-step implementation plan, with tasks, files and done criteria, is in [ROADMAP.md Phase 2b](ROADMAP.md#phase-2b--spanispace-services-marketplace-planned-20-oct-2026-not-started). Summary:

| Phase | Scope |
|-------|-------|
| **S0: Legal and terms** | Terms "Services" section, Service Provider Agreement, middleman disclaimer, cancellation policy, privacy policy updates, lawyer review |
| **S1: Foundations** | Migration, categories (all), provider enrolment (opt-in and new signup), police clearance upload, admin verification queue, agreement acceptance |
| **S2: Discovery** | Public `/services` search and profiles, only verified providers listed |
| **S3: Guarded messaging** | Service threads, `contactGuard` with server-side enforcement, violation logging |
| **S4: Agreement and payment** | Gateway selection and integration, offers, R10 checkout, webhook confirmation, contact unlock, receipts, refunds and credits |
| **S5: Company hiring** | `/company/services`, RBAC, multi-provider and recurring jobs, tax invoices |
| **S6: Reputation and safety** | Reviews, reports, disputes, strikes, auto-pause, police clearance expiry reminders |
| **S7 (later)** | Escrow payouts, background-check API, credit bundles, mobile app support |

### 7.12 Decisions (20 Oct 2026) and remaining questions

| Question | Decision |
|----------|----------|
| Fee model and amount | **Flat R10 per booking** for every category and price, charged to the requester. It's a starting figure and can be revisited |
| Payment gateway | **None exists yet.** Choosing one is step S4.0, and it will also serve company subscriptions later (§7.7) |
| Police clearance | **The provider uploads a SAPS Police Clearance Certificate**, which is cheaper than a background-check service. An admin reviews it. A background-check API stays a later option |
| Categories at launch | **All categories.** Regulated trades (electrical, gas, compliance plumbing) still need their trade certificate before that category goes live on a provider's listing |
| Can companies hire? | **Yes, through a separate company flow** (§7.13) |
| Cancellation and refunds | Proposed policy in §7.7a. It needs a legal review before launch |
| Liability | **A middleman disclaimer is required** (§7.14) |

Still open:
1. **After the unlock,** should the service price also be paid through Spanispace (escrow), or always directly between the parties? v1 is direct.
2. **Anonymous browsing:** should visitors without an account see full profiles, or only a summary? The proposal is a summary, with full profiles for signed-in users.
3. **Police clearance validity:** the proposal is 12 months from the issue date, then re-upload.
4. **Is Spanispace VAT-registered?** This decides whether R10 is shown "incl. VAT" and whether tax invoices are issued to companies.

### 7.13 Company hiring (separate from individual hiring)

Companies can hire providers, for example office cleaning, painting a branch or a one-off maintenance job. The flow differs from individual hiring:

| Aspect | Individual requester | Company requester |
|--------|---------------------|-------------------|
| Who can book | The account holder | Company members with role **Manager or above** (`company_members` RBAC). Members and Viewers can browse and shortlist only |
| Eligibility | Any signed-in user | The company must be **vetted/verified** first (existing company vetting) |
| Request form | Suburb, date, description | Adds the business name, site address, an on-site contact person, an optional purchase-order or reference number, and site access or safety requirements (induction, PPE, working hours) |
| Multiple providers | One provider per booking | **One job can book several providers** (for example 3 cleaners). Each provider is a separate booking at R10, grouped under one `service_job` |
| Recurring work | Book again manually | **Repeat booking** of the same provider on a schedule (weekly or monthly), with each occurrence a new R10 booking |
| Payment | Card or instant EFT at checkout | Card or instant EFT at checkout in v1. Later, a monthly statement or invoice billed to the company account |
| Invoice | Receipt | A **tax invoice** in the company's registered name and VAT number (if Spanispace is VAT-registered), downloadable from `/company/services` |
| Visibility | The requester's own bookings | Every company member with Manager or above sees all of the company's service bookings. Viewers have read-only access |
| Contact unlock | Requester ↔ provider | The provider sees the company's **designated site contact**, not every team member's details |
| Reviews | From the individual | Posted as the company. Shown on the provider profile as "Reviewed by a verified business" |
| Where it lives | `/services/bookings` | `/company/services` (a company-portal page, alongside jobs and candidates) |

Data: `service_threads` and `service_bookings` get a nullable `company_id`. A booking with `company_id` set follows the company rules, and the RLS helper checks `company_members` role for access. A new `service_jobs` table groups multi-provider and recurring bookings.

### 7.14 Middleman disclaimer

Spanispace is a marketplace that connects requesters with independent providers. It is not the provider's employer and not a party to the service agreement between them. The disclaimer must appear:
- in the **Terms of Service** (a new "Spanispace Services" section)
- in the **Service Provider Agreement**
- as a **tick box at checkout**, which must be ticked before payment
- as a short line on every provider profile and booking receipt

**Draft wording** (to be reviewed by a lawyer):

> Spanispace is an online marketplace that connects people who need a service with independent service providers. Service providers are not employees, agents or contractors of Spanispace. Any agreement for a service, including its scope, price, quality, timing and payment, is made directly between you and the service provider. Spanispace is not a party to that agreement.
>
> We verify a provider's identity and check the police clearance certificate they submit at the time of enrolment. That verification is limited to the documents provided and does not guarantee a provider's conduct, skills, honesty or the quality of their work. To the fullest extent permitted by law, Spanispace is not liable for the quality, safety, legality or outcome of any service, for any loss, damage or injury arising from it, or for any criminal or unlawful act by a provider or requester.
>
> Please take sensible safety precautions. If a crime occurs, report it to the South African Police Service (SAPS) immediately, and then report it to us through the in-app report button so we can suspend the account and cooperate with the investigation.

**Legal caveat:** under the CPA (s48–s51), a term that waives liability for Spanispace's **own** gross negligence, or that is unfair or unreasonable, is not enforceable. The disclaimer protects Spanispace for the providers' acts, but not for failing to do what it promises. Spanispace must therefore:
- actually carry out the verification it advertises
- act on reports quickly
- keep records of each verification decision

The badge must say exactly what was checked ("ID and police clearance checked on [date]"), not "safe" or "trusted". Have the final wording reviewed by a South African attorney before launch.
