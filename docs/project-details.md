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
| **Candidate** | Job seekers, learners, students, informal and piece-job workers | Build a profile (education, work history including informal work, documents, skills), apply for jobs and learnerships, get matched through auto-apply, take SpaniSpace Academy courses, get document-verified, message companies, manage interviews on a calendar. Can also **offer services** (Spanispace Services, §7): enrol, get verified and list a rate card at `/candidate/services` |
| **Company** | Employers, multi-user organisations | Post and manage jobs, see view/drop-off analytics, search the talent pool, invite candidates, run events and training, message candidates, schedule interviews, manage a team with roles (Owner/Admin/Manager/Member/Viewer) |
| **Admin** | Spanispace staff (Super Admin / Platform Admin) | Vet jobs, events, trainings and companies, verify candidate documents, verify service providers (`/admin/service-providers`), manage users and invites, review scraped and curated listings |

The public site is open to everyone and offers a jobs board (company-posted, admin-curated and scraped listings), learnerships, events, a training catalogue, late university/college applications, and **Spanispace Services** (`/services`), where you can browse verified providers for short jobs. Customers can request quotes and chat with providers (contact details blocked). Booking and payment aren't open yet. It is available in English and isiZulu (isiZulu is in beta).

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
| **Service booking fee (Spanispace Services)** | **R10 flat per booking, always paid online.** Specified in §7. Provider enrolment and public browsing are built (S1, S2, 20 Oct 2026); charging the fee comes in S4 |

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
   - **Rate card:** priced items in the units the category allows (painting per m², per room or per day; cleaning per hour or per room; laundry per load or per kg; and so on), with an optional minimum charge. Rates are indicative, and the final price is agreed in the chat offer
- **How the provider gets paid for the service:** cash only, online only, or cash or online. **Cash** means physical money handed over on the day. **Online** means paid through Spanispace (card, instant EFT and the other gateway methods). Online needs a payout bank account, verified through the gateway (account holder name matched to the ID). This choice covers the service price only. The R10 Spanispace fee is always paid online
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
   - Re-verification: **police clearance is valid for 12 months from its issue date** (confirmed 20 Oct 2026). After that the badge drops off and the listing pauses until a new certificate is uploaded and approved
4. **Terms acceptance.** Before going live the provider must accept a **Service Provider Agreement**, which covers:
   - The platform fee model, and that it is charged to the requester
   - **No off-platform contact or payment circumvention.** No sharing of contact details before an agreement, and no asking clients to "book direct" to avoid the fee. Breaches lead to a warning, then suspension, then removal
   - Conduct, safety, and honest representation of skills and qualifications
   - That the provider is an independent contractor, not an employee of Spanispace or the requester
   - Consent to verification, including processing criminal-record information (POPIA §26 special personal information, which needs explicit consent)
   - The agreement version and timestamp are stored per provider, and they must re-accept when the terms change
5. **Live.** The listing appears in search, and the provider receives requests in their inbox.

### 7.4 Requester journey: finding, agreeing, paying (defined 20 Oct 2026)

**Worked example:** Thandi needs her lounge and two bedrooms painted.

1. **Find the service.** Thandi opens `/services` and picks **Painting**. Browsing is public, but messaging needs an account.
2. **Compare providers and rates.** She sees a list of verified painters in her area. Each card shows the painter's **rate card**: prices in the units that make sense for the category, such as R45/m² for walls, R1,200 per room or R600 per day. Each card also shows rating, badges, completed jobs, and **which payment methods the painter accepts** (Cash · Online · Cash or Online). Filters: area, date, price, rating, payment method. A quick estimator lets her enter "35 m²" and see each painter's estimated price. This is only an indication, and the real price is agreed in the chat.
3. **Open a request.** Thandi taps "Message" on a painter. The first time, this creates a **service request**: her need, with the category, a description ("lounge + 2 bedrooms, walls only, paint supplied"), her suburb, preferred dates and optional photos. **The chat belongs to this request.** It's a page for this one need, not a general inbox thread.
4. **Talk to several providers.** She can message other painters **under the same request**. The request page shows all her conversations side by side, so she can compare quotes. Contact details stay blocked in every chat (§7.6).
5. **Agree an offer.** Inside one chat, either party can open the **Offer panel**, which shows:
   - the scope, the start date and number of days, and the service price
   - the payment method, limited to what the provider accepts. If the provider accepts both, Thandi picks
   - the Spanispace booking fee of R10, as a separate line
   - the terms and disclaimer

   Each side has its own **"I accept the terms and agree to this offer"** button. **The booking only forms when both have accepted the same version.** If either side edits anything, both acceptances reset.
6. **Payment at agreement.** As soon as both have accepted:
   - **Cash job:** Thandi pays the **R10 online**. She pays the painter in physical cash when the job is done.
   - **Online job:** Thandi pays **the service price + R10** online, in one payment. **The booking isn't confirmed and the painter isn't released (dispatched) until the debit succeeds.** Spanispace holds the service money until the job is completed and both parties have confirmed (§7.15).
   - Either way, the booking becomes `confirmed` only when the payment webhook succeeds.
7. **Unlock.** Once confirmed, the chat unlocks. Each party sees the other's verified phone number, and the painter sees the full address. Thandi's **other conversations under this request** get a system message ("The requester has booked another provider") and close. She can reopen the request if this booking falls through.
8. **Job in progress.** Tracked step by step (§7.15): scheduled → on the way → started (start code) → in progress → marked complete by the provider → confirmed by the requester.
9. **Pay the provider:**
   - **Online job:** once both parties confirm completion (or the confirmation window passes with no dispute), Spanispace releases the payout to the painter's verified bank account.
   - **Cash job:** the painter taps "Cash received" and Thandi confirms.
10. **Review.** Each side leaves a rating and review. Reviews are only allowed on completed bookings (CPA, and checklist item 11).

**Provider payment preference for the service price** (set at enrolment, and changeable later):
- **Cash only:** physical money, paid to the provider on the day
- **Online only:** paid through Spanispace, held, then paid out after completion
- **Cash or online:** the requester picks in the offer

The preference shows on the listing, and the Offer panel only offers the methods the provider allows. To accept online payments, a provider must add a bank account that passes verification (§7.3).

**The R10 Spanispace fee is always paid online, for every job.** Cash is never accepted for it, and providers never collect it.

### 7.5 Booking lifecycle

```
                   (per conversation)                               (once both accept)
request ─► chatting ─► offer_proposed ─► offer_agreed ─► payment_pending ─► confirmed ─► scheduled
                            │  ▲ edit resets both           │                              │
                            ▼  │                            ▼                              ▼
                         declined                  payment_failed / expired*        provider_en_route
                                                                                           │
                                                   start code entered ──────────────► in_progress
                                                                                           │
                                                                                provider_marked_complete
                                                                                           │
                                                  requester confirms (or 72h silence) ─────┤
                                                                                           ▼
                                                                  completed ─► (online) payout_released ─► closed
                                                                       ▲
                       disputed ──► admin decision (release / partial / refund) ──┘
               cancelled (from any state before in_progress, per §7.7a)
```

`*` If both parties agree but the payment isn't completed within 48 hours, the agreement expires and the provider is free again.

The **request** has its own status: `open` (chatting with one or more providers) → `booked` (one booking confirmed; other conversations closed) → `completed` / `cancelled`. If the booking is cancelled, the request goes back to `open`.

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

- **The Spanispace booking fee is a flat R10 per booking** (decided 20 Oct 2026). It is the same for every category and every service price, and it is charged to the requester. It is always separate from the provider's service price, and **it is always paid online, never in cash**. On a cash job it is the only online charge. On an online job it is collected in the same payment as the service price, but recorded separately.
- **Online jobs: Spanispace holds the money** (decided 20 Oct 2026). The service price is debited at agreement and held until completion is confirmed, then paid out to the provider. This is effectively **escrow in v1**, and it has consequences:
  - **The gateway must support holding funds and paying out later to third parties.** Look for marketplace or split payments, sub-accounts, or a transfers/payouts API with bank-account verification. This becomes a hard requirement in S4.0.
  - **Regulation:** collecting money on behalf of providers and paying it out later may make Spanispace a third-party payment collector under the National Payment System Act. The usual route is to operate inside a registered gateway's marketplace product instead of holding funds in Spanispace's own bank account. **Confirm with the gateway and the attorney before building S4.**
  - **The provider pays the gateway's processing fee on the service price** (confirmed by Linda, 20 Oct 2026). It's deducted from the payout and shown upfront in the Offer panel ("Offer R1,500 → you receive R1,4xx"). Spanispace absorbs the processing fee on the R10.
  - **Payout timing:** Spanispace starts the payout when the job reaches `completed`, and the gateway settles it on its own schedule (often 1–3 business days). That timing should be shown to providers.
  - Store the fee in one config value (`SERVICE_BOOKING_FEE_CENTS = 1000`), and copy it onto each booking as `platform_fee` when the offer is accepted. Changing the fee later then never rewrites past bookings.
  - **Company bookings** pay R10 per provider booked (see §7.13).
- Fees are shown in ZAR **before** the requester accepts the offer (CPA, and checklist item 10). Spanispace is **not VAT-registered yet**, so the fee is shown as a plain "R10" with no VAT (see §8.1).
- Charged only after both parties have agreed, on offer acceptance. There is no charge for enquiries or browsing.
- **Payment gateway: none exists yet** (decided 20 Oct 2026). Choosing and integrating one is step S4.0 of the plan, and the same gateway will later serve company subscriptions (Phase 2.1). Requirements:
  - card and instant EFT
  - signed webhooks
  - refunds through the API
  - a sandbox
  - South African settlement in ZAR
  - **low fixed per-transaction fees.** With a R10 fee, a fixed charge of R1–R2 plus a percentage takes a large share of every booking. Compare the gateways on the real cost of a R10 charge before choosing.

  Candidates are Paystack, PayFast, Peach Payments and Yoco. Recommendation: **Paystack**, for its API, webhooks and documentation quality, unless the cost comparison on a R10 charge clearly favours another. A later option is prepaid credit bundles (for example R50 for 5 bookings), which cut the per-transaction overhead.
- **Cash jobs:** Spanispace never touches the service price. The provider records "Cash received" and the requester confirms it, so there is an audit trail for disputes.

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

**Online jobs: the held service price.** The rules above cover the R10. The held service price follows these:

| Situation | Service price |
|-----------|---------------|
| Requester cancels **more than 24 hours** before the start | Refunded in full |
| Requester cancels **within 24 hours** of the start, or the provider arrives and the requester is absent or refuses access | Refunded **minus a late-cancellation fee paid to the provider: 10% of the service price, minimum R50, maximum R200** (confirmed by Linda, 20 Oct 2026). Cash jobs follow the escalation in the next table |
| Provider cancels, doesn't show up, or is suspended | Refunded in full (and the R10 too, per rule 3) |
| The job started, then stopped by agreement (multi-day job cut short) | Both parties agree a partial amount in the chat. The agreed part is paid out and the rest refunded. If they can't agree, it becomes a dispute |
| **Dispute** raised before completion is confirmed | **Funds are frozen.** An admin reviews the chat, the job timeline and photos, then releases in full, releases part and refunds the rest, or refunds in full. Spanispace decides only how the held money is paid out, and gives no judgement on workmanship beyond that (§7.14) |
| The requester doesn't respond within **72 hours** after the provider marks the job complete | **Treated as confirmed** and paid out, so a requester can't hold the money back by staying silent. The requester gets reminders at 24 and 48 hours |

**Cash jobs: late cancellation (proposed 20 Oct 2026, awaiting Linda's approval).** On a cash job nothing is held, so there's nothing to take a fee from on the spot. Instead, the requester's reliability gets tracked, and requesters who repeatedly cancel late have to put money down:

| Requester's record (rolling 90 days) | What applies to their next **cash** bookings |
|--------------------------------------|---------------------------------------------|
| No late cancellations | Normal: only the R10 online |
| **1 late cancellation** (within 24 hours of the start, or absent or refusing access) | A warning, and the event is recorded. Providers see the requester's **reliability** on the request ("Completed 4 of 5 bookings") |
| **2 late cancellations** | A **commitment deposit** is paid online with the R10. It equals the late-cancellation fee (10% of the agreed price, minimum R50, maximum R200). If the job goes ahead, the deposit counts toward the price and the requester pays the rest in cash, with the deposit paid out to the provider. If they cancel late again, the deposit goes to the provider as their late-cancellation fee |
| **3 or more late cancellations** | **Cash bookings blocked for 90 days.** The requester can still book providers who accept online payment, where the normal held-money rules apply |

Why this approach:
- it compensates the provider in the cases that matter (repeat offenders), without adding friction for the first-time requester
- it uses money that's already held online, so a provider never has to chase cash
- the escalation is fair, transparent and stated upfront, which matters because CPA s17 lets a supplier charge a reasonable cancellation penalty on advance bookings

Effects on the build:
- A cash-only provider needs a payout account to receive a deposit. If a deposit applies and the provider has none, the deposit is held until they add one, with reminders, and refunded to the requester after 30 days if no account is added.
- Late cancellations are stored as `requester_strikes`, the mirror of `provider_strikes`.
- An admin can remove a strike on appeal, for example after a family emergency.

The gateway's processing fee on a refunded charge usually isn't returned to the merchant, so Spanispace absorbs it, except when the refund is caused by the provider. Whether to pass that cost on to providers is awaiting Linda's decision (§7.12).

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
| `provider_services` | `provider_id`, `category_id`, `years_experience`, `description` |
| `provider_rates` | **The rate card.** One row per priced item: `provider_service_id`, `label` (for example "Interior walls" or "Full room"), `unit` from the category's allowed units, `price_cents`, `minimum_charge_cents`, `notes` ("paint not included") |
| `service_category_units` | The units that make sense for each category, which drive the rate card and the estimator. Painting: m², room, day. Cleaning: hour, room, once-off by house size. Laundry: load, kg, item. Plumbing: call-out, hour, job. Gardening: hour, m², visit |
| `provider_payout_accounts` | Only for providers who accept online payment: bank and account reference **held by the gateway** (a sub-account or recipient code, never raw card or bank details stored by us), `verified_at` |
| `service_requests` | The requester's need: `id`, `requester_user_id`, `company_id` (nullable), `category_id`, `description`, `suburb`, `preferred_dates`, `photos`, `status` (`open`/`booked`/`completed`/`cancelled`) |
| `service_offers` | Versioned offers in a thread: `thread_id`, `version`, `scope`, `start_date`, `days`, `service_price_cents`, `payment_method` (`cash`/`online`, for the service price only; the R10 is always online), `requester_accepted_at`, `provider_accepted_at`. Any edit creates a new version with both acceptances empty |
| `job_events` | **The job timeline**, append-only: `booking_id`, `event` (§7.15), `actor_id`, `note`, `photo_urls`, `created_at` |
| `service_payouts` | Online jobs, plus cash-job commitment deposits: `booking_id`, `amount_cents`, `gateway_fee_cents`, `status` (`held`/`frozen`/`released`/`paid`/`refunded`/`partial`), `released_at`, `gateway_transfer_reference` |
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
| `requester_strikes` | `user_id`, `booking_id`, `reason` (`late_cancel`/`absent`/`refused_access`), `removed_by_admin`, `created_at`. Drives the reliability score and the cash-job escalation (§7.7a) |

`service_threads` gets a `request_id`, and the pair (`request_id`, `provider_id`) is unique: one conversation per provider per need. `service_bookings` gets `payment_method`, `start_code_hash`, `marked_complete_at`, `confirmed_complete_at` and `auto_confirm_at`. `service_threads` and `service_bookings` also carry a nullable `company_id` and `service_job_id` for company hiring (§7.13). `service_bookings` stores `terms_accepted_at` and `disclaimer_accepted_at`, the checkout tick boxes.

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
| `/services/provider/[id]` | Provider profile, with no contact details. **Signed-out visitors see a summary only** (first name, photo, categories, area, rate range, rating, badges); signing in shows the full rate card, portfolio and reviews, and lets them message |
| `/candidate/services/enrol` | Provider enrolment wizard (opt-in or new signup) |
| `/candidate/services` | Provider dashboard: listing, verification status, bookings, earnings history |
| `/services/requests/[id]` | A requester's need, with all its conversations side by side |
| `/services/requests/[id]/chat/[threadId]` | The chat page for this need with one provider, including the Offer panel and both accept buttons |
| `/services/jobs/[bookingId]` | Job tracking page (timeline, start code, mark complete, confirm, dispute), for both parties |
| `/services/messages` | Service inbox for both providers and requesters (lists requests and threads) |
| `/services/bookings` | A requester's bookings and receipts |
| `/admin/service-providers` | Verification queue |
| `/admin/service-reports` | Disputes, reports and contact-violation review |
| `POST /api/services/messages` | Guarded message send |
| `POST /api/services/bookings/[id]/pay` | Start the fee payment |
| `POST /api/services/webhook` | Payment provider webhook, the only thing that confirms a booking and unlocks contact |
| `POST /api/services/offers/[id]/accept` | Accept the current offer version. When both sides have accepted, it creates the booking and starts payment |
| `POST /api/services/jobs/[id]/event` | Job timeline actions (on the way, start with code, mark complete, confirm, dispute, cash received) |

### 7.11 Delivery phases

The full step-by-step implementation plan, with tasks, files and done criteria, is in [ROADMAP.md Phase 2b](ROADMAP.md#phase-2b--spanispace-services-marketplace-planned-20-oct-2026-s1s3-code-done). Summary:

| Phase | Status (20 Oct 2026) | Scope |
|-------|--------|-------|
| **S0: Legal and terms** | Provider agreement drafted, the rest open | Terms "Services" section, Service Provider Agreement, middleman disclaimer, cancellation policy, privacy policy updates, lawyer review |
| **S1: Foundations** | ✅ Code done, migration not run | Migration, categories (all), provider enrolment (opt-in and new signup), police clearance upload, admin verification queue, agreement acceptance |
| **S2: Discovery** | ✅ Mostly done (no estimator or portfolio yet), same migration | Public `/services` search, profiles with rate cards and the estimator, payment-method filter, only verified providers listed |
| **S3: Requests and guarded messaging** | ✅ Code done, needs `add-service-requests-messaging.sql`. No email notifications yet | Service requests with several conversations per need, per-request chat page, `contactGuard` with server-side enforcement, violation logging |
| **S4: Agreement and payment** | Not started (no gateway yet) | Gateway selection (must support held funds and payouts), versioned offers with acceptance from both sides, R10 online for cash jobs, or service price + R10 online for online jobs, webhook confirmation, contact unlock, receipts, refunds and credits |
| **S4b: Job tracking and payouts** | Not started | Job timeline and start code, provider marks complete, requester confirms or the 72h auto-confirm, online payouts, cash-received confirmation, dispute freeze |
| **S5: Company hiring** | Not started | `/company/services`, RBAC, multi-provider and recurring jobs, invoices (tax invoices once VAT-registered) |
| **S6: Reputation and safety** | Not started | Reviews, reports, disputes, strikes, auto-pause, police clearance expiry reminders |
| **S7 (later)** | Not started | Milestone payments for long jobs, background-check API, credit bundles, mobile app with live location for "on the way" |

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
| Gateway fee on online service payments | **The provider pays it**, deducted from the payout and shown upfront (confirmed 20 Oct 2026) |
| Late-cancellation fee | **10% of the service price, minimum R50, maximum R200**, paid to the provider when the requester cancels within 24 hours on an online job (confirmed 20 Oct 2026) |

| Payment journey | **Defined (20 Oct 2026, §7.4).** One request can have several conversations. Both parties accept the terms and the offer. R10 is charged on agreement. Providers choose how the service is paid: cash only (physical money), online only, or cash or online. **The R10 is always online.** Online jobs are debited at agreement and the provider is only released after the debit succeeds. The money is held and paid out only when the job is completed and both confirm |

| Anonymous browsing | **Summary only** for signed-out visitors. Full profiles and messaging need an account (confirmed 20 Oct 2026) |
| Police clearance validity | **12 months from the issue date**, then re-upload (confirmed 20 Oct 2026) |
| VAT | **Not registered yet.** No VAT is charged or shown, and companies get ordinary invoices (§8.1) |
| Holding online-job money | **Recorded for legal review** (§8, R1) |

Awaiting Linda's approval:
1. **Cash-job late cancellation:** the reliability and commitment-deposit escalation proposed in §7.7a.
2. **Gateway fee lost on refunds:** when a refund is caused by the provider (cancellation, no-show, suspension), should the lost processing fee be recovered from the provider's next payout? The proposal is yes for online-payment providers. Otherwise Spanispace absorbs it.

Everything else that needs outside advice is in the **[Legal and tax review register](#8-legal-and-tax-review-register)** (§8).

### 7.13 Company hiring (separate from individual hiring)

Companies can hire providers, for example office cleaning, painting a branch or a one-off maintenance job. The flow differs from individual hiring:

| Aspect | Individual requester | Company requester |
|--------|---------------------|-------------------|
| Who can book | The account holder | Company members with role **Manager or above** (`company_members` RBAC). Members and Viewers can browse and shortlist only |
| Eligibility | Any signed-in user | The company must be **vetted/verified** first (existing company vetting) |
| Request form | Suburb, date, description | Adds the business name, site address, an on-site contact person, an optional purchase-order or reference number, and site access or safety requirements (induction, PPE, working hours) |
| Multiple providers | One provider per booking | **One job can book several providers** (for example 3 cleaners). Each provider is a separate booking at R10, grouped under one `service_job` |
| Recurring work | Book again manually | **Repeat booking** of the same provider on a schedule (weekly or monthly), with each occurrence a new R10 booking |
| Payment | R10 online, with the service paid in cash or online | The same in v1 (R10 online, with the service paid in cash or online per the provider's choice). Later, a monthly statement or invoice billed to the company account |
| Invoice | Receipt | An **invoice** in the company's registered name, downloadable from `/company/services`. It becomes a **tax invoice** once Spanispace is VAT-registered (§8.1) |
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

### 7.15 Job tracking (a job in progress)

Every confirmed booking gets a job page at `/services/jobs/[bookingId]`. Both parties see the same timeline. Each step is a row in `job_events`, an append-only log with who did it, when, and any note or photo. The log is the evidence base for disputes, no-show refunds and payouts.

| Step | Who triggers it | What happens |
|------|-----------------|--------------|
| **Scheduled** | System, on payment success | Job date and time, address and both phone numbers shown. Reminders sent the day before |
| **On the way** | Provider taps "On my way" | The requester is notified. An optional ETA is shown, and live location is later work (S7) |
| **Started** | Provider enters the requester's **4-digit start code** | The code is shown only in the requester's app and stored hashed. Entering it proves the provider arrived and the requester was there. The requester can also tap "Provider has arrived" if the provider's phone is a problem |
| **In progress** | Automatic after the start | Multi-day jobs get a **daily check-in** (the provider taps "Day 2 started" or "Day 2 done"). Either side can post progress notes and photos |
| **Issue raised** (optional) | Either party | Flags a problem without stopping the job (for example "extra wall found, needs a new price"). A price change goes through a **new offer version**, accepted by both. For online jobs, the difference is charged or refunded online. For cash jobs, the new price is just what's paid on the day |
| **Marked complete** | Provider | Requires at least one "after" photo for categories where it makes sense (painting, cleaning, gardening, and so on). Starts the **72-hour confirmation window** |
| **Confirmed complete** | Requester taps "Confirm job done", or 72 hours pass with no response | **Online:** the payout is released. **Cash:** the provider taps "Cash received" and the requester confirms. A mismatch gets flagged to an admin |
| **Disputed** | Requester (before confirming) or provider (after a refusal) | **Online:** the held money is frozen. An admin reviews the timeline, chat and photos, and decides (§7.7a). **Cash:** an admin can mediate, refund the R10 or apply strikes, but there's no money to move |
| **Closed** | System | The review prompt goes to both parties, and the request moves to `completed` |

**Safety in the job page:**
- An **emergency / report** button on the job page, which links to SAPS 10111 and the in-app report (§7.14).
- Address and phone numbers are visible only from `scheduled` until 7 days after `closed`, then hidden again.

**Timers (scheduled job, `pg_cron` or GitHub Actions):**
- Unpaid agreements expire after 48 hours.
- A no-show is flagged if the job is not `started` within 2 hours of the start time. The requester can then report a no-show, which leads to a full refund and a strike (§7.7a).
- The 72-hour auto-confirm after the provider marks the job complete.
- Clearance expiry reminders.


---

## 8. Legal and tax review register

These are questions Spanispace can't settle on its own. Each needs a South African attorney (or, for tax, an accountant or tax practitioner) before the related feature goes live. When an item is resolved, update its status, record the advice and the date, and link the source.

| # | Topic | The question | Why it matters | Blocks | Reviewer | Status |
|---|-------|--------------|----------------|--------|----------|--------|
| R1 | **Holding online-job money** (National Payment System Act, SARB directives on payments to third persons) | Can Spanispace collect a requester's service payment, hold it until completion, and pay it out to the provider? Is operating inside a registered gateway's marketplace or sub-account product enough, or does Spanispace need its own registration (for example as a third-party payment provider through a sponsoring bank)? | Collecting money on behalf of others is regulated, and getting it wrong could mean having to stop online service payments | S4 online jobs (fallback: collect only the R10 online) | Attorney + the chosen gateway's compliance team | **Open** |
| R2 | **Middleman disclaimer** (CPA s48–s51) | Is the §7.14 wording enforceable? What is the most Spanispace can disclaim for service quality and for crimes by providers or requesters? | The CPA voids terms that are unfair, or that waive liability for the supplier's own gross negligence | S0, S4 go-live | Attorney | **Open** |
| R3 | **Cancellation and refunds** (CPA s17, ECT Act s42/s44) | Is the §7.7a policy lawful? That covers: no refund of the R10 after the unlock, the 10% (R50–R200) late-cancellation fee, the cash-job commitment deposit, and the 72-hour auto-confirm | CPA s17 allows only a *reasonable* cancellation penalty. The ECT 7-day cooling-off is excluded only for services that started with consent | S4 go-live | Attorney | **Open** |
| R4 | **Criminal record data** (POPIA s26–s27, s33) | Is the consent wording enough to collect police clearance certificates? What is the retention period? Can the file be deleted after review, keeping only the outcome? | Criminal behaviour is special personal information, and processing it is prohibited without a lawful basis | S1 | Attorney / Information Officer | **Open** |
| R5 | **Independent contractor status** (Labour Relations Act s200A, BCEA) | Could providers be deemed Spanispace employees, given that Spanispace sets the fee, holds payment and applies strikes? | A deemed employment relationship would bring labour-law duties | S1 Service Provider Agreement | Attorney | **Open** |
| R6 | **VAT and turnover** (VAT Act) | Spanispace is **not VAT-registered yet**. When must it register, and does held service money count as Spanispace's turnover? See §8.1 | This decides when VAT applies to the R10, and whether the service price counts toward the threshold | Ongoing, S5 invoices | Accountant / tax practitioner | **Open, monitor** |
| R7 | **Message scanning and admin access** (POPIA s18 notification, s11 lawful basis) | Is scanning service chats for contact details, and letting admins read threads during disputes, adequately disclosed and justified? | It is processing of private communications | S3 | Attorney / Information Officer | **Open** |
| R8 | **Age** (POPIA s34–s35) | Is checking 18+ from the SA ID number enough for providers, and what applies to requesters? | Children's data needs a competent person's consent | S1 | Attorney | **Open** (links to compliance item 17) |

### 8.1 VAT: what "not registered yet" means

**Current position (20 Oct 2026):** Spanispace is not VAT-registered.

**What that means now:**
- Spanispace **must not charge or show VAT** on anything. The R10 is just **"R10"**, with no "incl. VAT" and no VAT line. Charging VAT while unregistered is not allowed.
- Spanispace **can't issue tax invoices**. Companies get an ordinary **invoice or receipt** showing Spanispace's name, the date, a description and the amount. A company can't claim input VAT on it. That cost is small at R10 per booking, but worth saying in the company terms.
- Spanispace also can't claim VAT back on its own costs, such as gateway fees or hosting.

**When registration becomes necessary:**
- **Compulsory** once taxable supplies exceed **R1 million in any 12 consecutive months**, or are expected to. This threshold has been R1 million for years. National Treasury has proposed raising it, so **check the current figure with the accountant**.
- **Voluntary** registration is possible once taxable supplies pass **R50,000 in 12 months**. Being able to issue tax invoices can help with company clients.
- The standard rate is **15%**.

**The open question (R6): what counts as Spanispace's turnover.**
- **Cash jobs:** only the R10 fees are Spanispace's supplies.
- **Online jobs:**
  - If Spanispace collects the service price **as the provider's agent** (the provider supplies the service, and Spanispace only facilitates and passes the money on), then only the **R10 counts**. On that basis, about 100,000 bookings a year (R1m ÷ R10) would be needed to reach the threshold.
  - If Spanispace is treated as the **principal**, selling the service itself, then **the whole service price counts**. The threshold could then be reached quickly, and VAT would apply to the full amount.
  - The terms, the Service Provider Agreement and the money flow must be written to support the **agent** position, and the accountant should confirm it.

**When Spanispace does register:**
- Decide whether **R10 stays the price including VAT** (Spanispace keeps about R8.70) or **becomes R11.50** (R10 + 15%). The CPA requires the price shown to include VAT.
- Start issuing **tax invoices** to companies, with Spanispace's VAT number.
- Update the price display, the receipts and §7.13.

**What to build now so registration is easy later:**
- Store `vat_cents` (0 for now) and `vat_rate` on every fee charge.
- Keep a `SPANISPACE_VAT_REGISTERED=false` setting that drives the receipt and invoice templates.
- Track rolling 12-month fee turnover in the admin dashboard, with an alert at R800,000.
