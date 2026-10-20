# 20 Oct 2026 — Project details doc, Spanispace Services spec

## Project details document

There was no single document explaining what Spanispace is. The ROADMAP tracks status and the changelog tracks history, but neither gives the overview. Added `docs/project-details.md`. It covers the overview of the three portals, the problem, the mission and goals, the business model, the stack, and trust and compliance.

## Spanispace Services: feature specification

Linda asked for a new section of the platform where people offer short-term everyday services (cleaning, laundry, painting, plumbing and so on) instead of looking for employment. Specified in `docs/project-details.md` §7. No code has been written yet.

The key decisions written into the spec:
- **A provider is a capability, not a new `users.role`.** A candidate can opt in and stays a candidate, so a provider is a `service_providers` row next to `candidate_profiles`.
- **Verification comes before listing,** reviewed by an admin as company vetting is: ID, selfie, SAPS police clearance, proof of address, and trade certificates for regulated categories. Requesters see badges, never documents.
- **Contact blocking has to be server-side.** `components/messaging/MessagesInbox.tsx` currently inserts into `messages` directly from the browser, so a client-only filter could be bypassed. Service chats get their own `service_threads`/`service_messages` tables, which leaves the company↔candidate `message_threads` RLS untouched, and a guarded send route. Only the payment webhook can set `contact_unlocked`.
- **The booking fee is separate from the service price,** charged to the requester only after a structured offer is accepted. In v1 the provider is paid directly. Escrow is deferred.
- **Compliance:** criminal-record data is POPIA §26 special personal information. The fees and refund policy fall under the CPA and ECT Act, and providers must be 18 or older.

Open questions (fee model, payment gateway, police clearance approach, launch categories, cancellation rules) are listed in §7.12 and in ROADMAP Phase 2b.

## Spanispace Services: decisions and implementation plan

Linda answered the open questions:
- the fee is a **flat R10 per booking**, whatever the service
- there is **no payment gateway yet**
- **providers upload a SAPS police clearance** (cheaper than a check service)
- a **middleman disclaimer** is needed, saying Spanispace is not responsible for service quality or for crimes
- **all categories** launch at once
- **companies can hire, through a separate flow**
- Claude was asked to draft the cancellation and refund rules

Changes to `docs/project-details.md`:
- §7.7: the R10 fee, plus gateway requirements. A fixed per-transaction gateway fee takes a big share of R10, so compare the gateways on that before choosing. Paystack is recommended
- new §7.7a: the cancellation and refund policy. Provider fault means a full refund. A requester cancelling more than 24 hours ahead gets a R10 credit, at most once per 30 days. A requester cancelling within 24 hours, or not showing up, gets nothing. Fees are not refunded once contact unlocks, because that is exactly the moment someone could take the number and book directly. Includes a strike rule and an ECT s44 cooling-off tick box
- §7.8: new tables `service_jobs`, `service_payments`, `service_credits`, `provider_strikes`
- §7.12: the decisions table
- new §7.13: how company hiring differs (Manager+ RBAC, multi-provider and recurring jobs, tax invoices, site contact only)
- new §7.14: draft disclaimer wording, with the CPA s48–51 caveat that liability for Spanispace's own negligence cannot be waived, so the verification it advertises has to actually happen and be recorded

`docs/ROADMAP.md` Phase 2b is now the full plan: steps S0 (legal) to S7, each with tasks, files and done criteria. It also adds a "Spanispace Services live" Q1 2027 milestone.

## Spanispace Services: payment journey and job tracking

Linda defined the payment journey:
- a user finds a category (for example painting), compares providers' rates
- they can open conversations with several providers
- each chat page belongs to that one need, and has accept-terms and agree-to-offer buttons for both parties
- R10 is charged on agreement
- providers choose cash only, card only, or cash or card
- for card jobs, the provider isn't released until the debit succeeds, and isn't paid until the job is complete and both parties agree
- this needs job tracking

Changes to `docs/project-details.md`:
- **§7.4 rewritten** as a worked example. New pieces:
  - **service requests**, so one need can have several conversations, and booking one closes the others
  - **rate cards** in each category's units (m², room, hour, load and so on), with an estimator
  - **versioned offers that both sides must accept**, where any edit resets both acceptances
  - the provider's payment preference
- **§7.5:** a new lifecycle diagram covering held funds, the start code, the 72-hour auto-confirm and disputes.
- **§7.7: escrow moves from v2 into v1** for card jobs. That makes the gateway's ability to hold funds and pay out later a hard requirement. It also raises a National Payment System Act question (collecting money for third parties), flagged for the attorney. Still open: who pays the gateway fee on the service price. The proposal is the provider, deducted from the payout.
- **§7.7a:** rules for the held service price:
  - requester cancels more than 24 hours ahead: full refund
  - requester cancels within 24 hours: refund minus a late-cancellation fee to the provider (10%, minimum R50, maximum R200)
  - provider at fault: full refund
  - disputes freeze the money until an admin decides
  - requester silence auto-confirms after 72 hours, so payouts can't be held back
- **§7.8:** new tables `service_requests`, `service_offers`, `provider_rates`, `service_category_units`, `provider_payout_accounts`, `job_events` and `service_payouts`.
- **New §7.15 (job tracking):**
  - steps: scheduled → on the way → started (with the requester's 4-digit start code as proof of arrival) → in progress (daily check-ins) → marked complete (needs an after photo) → confirmed → closed
  - timers for no-shows and auto-confirm
  - a safety button on the job page
- **§7.10 and §7.11:** the request, chat and job pages, the offer and job-event routes, and a new phase S4b.

`docs/ROADMAP.md` Phase 2b:
- the payment-journey decision is recorded
- S2 now includes rate cards and the estimator, S3 includes requests, and S4 includes the both-sides offer and card holding
- **new step S4b** for job tracking and payouts
- the gateway requirements and the attorney's scope are updated, a fallback is added (if holding funds isn't possible, card is used for the R10 only), and the milestone now covers S0–S4b

## Spanispace Services: payment terms clarified

Linda clarified that "credit" meant **online payment** (card, instant EFT and so on), not card specifically, and that "cash" means **physical money**. **The R10 Spanispace fee is always online, with no cash option.** The provider's payment preference covers the service price only: cash only, online only, or cash or online. The spec and ROADMAP Phase 2b now say "online" throughout where they said "card".

Linda also confirmed both of Claude's proposals:
- **The provider pays the gateway fee** on online service payments, deducted from the payout and shown upfront in the Offer panel
- **The late-cancellation fee** is 10% of the service price, minimum R50, maximum R200, paid to the provider when the requester cancels within 24 hours on an online job. Cash jobs have no held money, so they get no fee, only a reliability flag on the requester

## Spanispace Services: review register, VAT, remaining decisions

Linda's decisions:
- signed-out visitors see a **summary-only** provider profile
- **police clearance is valid for 12 months** from its issue date
- Spanispace is **not VAT-registered yet**
- the National Payment System Act question about holding online-job money goes into a review section in the docs

Changes to `docs/project-details.md`:
- **New §8, the Legal and tax review register.** It lists items R1–R8, each with the question, why it matters, what it blocks, who reviews it and its status: holding money under the NPS Act, the disclaimer under the CPA, cancellation under CPA s17 and ECT s42/s44, criminal-record data under POPIA, independent contractor status, VAT and turnover, message scanning, and age.
- **New §8.1, on VAT.** Because Spanispace is unregistered:
  - no VAT may be charged or shown, so the fee is a plain "R10"
  - companies get ordinary invoices, not tax invoices
  - registration is compulsory over R1m of taxable supplies in 12 months (the figure needs checking, since Treasury has proposed raising it), and voluntary from R50k
  - the key question is agent vs principal: if Spanispace collects held service money as the provider's agent, only the R10 counts toward turnover
  - build steps now: store `vat_cents = 0` on charges, add a `SPANISPACE_VAT_REGISTERED` setting, and an admin turnover alert at R800k
- **§7.7a proposal (awaiting Linda's approval): cash-job late cancellation.**
  - 1 late cancellation in 90 days: a warning and a reliability score shown to providers
  - 2: a commitment deposit (10%, R50–R200), paid online with the R10. It counts toward the price, or goes to the provider if they cancel late again
  - 3: cash bookings blocked for 90 days, though online-payment providers are still available
  - this adds a new `requester_strikes` table
- The §7.12 decisions table and the company invoice wording (§7.13) are updated, and the open questions are folded into §8.

`docs/ROADMAP.md` Phase 2b: the decisions table is updated, S0 now works through the review register, S2 shows summary-only profiles, S4 records VAT fields and the cash escalation (if approved), and S5 issues invoices plus the turnover alert.

## Spanispace Services: consistency pass

A final check of the spec found and fixed three stale spots:
- the provider card example still said "Card" instead of "Online"
- the §4 business model row didn't state the R10 fee
- the refund processing-fee question was marked "still open" without being tracked

That last one is now item 2 under "Awaiting Linda's approval" in §7.12, alongside the cash-job late-cancellation proposal.

## Spanispace Services S1 built: provider enrolment and verification

S1 is code-complete. **The migration hasn't been run yet**, and the pages error until `supabase/add-service-marketplace.sql` runs. It hasn't been run against any database, so ideally test it on a staging or branch project first.

**Database** (`supabase/add-service-marketplace.sql`, mirrored into `schema.sql`):
- 29 service categories, all launching together, each with its allowed pricing units. 6 regulated categories need a certificate: plumbing, electrical, gas, solar, pest control, security.
- New tables: `service_providers`, `provider_services`, `provider_rates`, `provider_documents`, `provider_strikes`.
- Three changes from the plan, all for privacy:
  - Verification documents get their own table and a **private** `provider-documents` bucket, because the existing `documents` bucket is public.
  - There is no public read policy until S2's safe-columns view, because RLS can't hide `date_of_birth` from public readers.
  - The SA ID number is never stored, only the date of birth derived from it.
- `BEFORE` guard triggers stop providers setting their own verification outcome, clearance dates, ratings or certificate approvals, the same approach as the `users.role` guard. "Verified" requires an in-date police clearance, for admins too, and a listing can only be on while verified.

**App:**
- `lib/services/contactGuard.ts` detects phone numbers, emails, links, handles and off-platform asks:
  - phone numbers in SA formats, as number words in English and isiZulu, with look-alike characters, or split by spaces or dashes
  - emails, including obfuscated "at"/"dot" forms
  - links, and handles
  - off-platform phrases in English and isiZulu

  To avoid false positives, a phone number must start and end on whole digit groups, so lists of prices aren't flagged, and dates are stripped out first. `scripts/test-contact-guard.ts` has 77 checks, all passing.
- `lib/services/saId.ts` checks the SA ID (Luhn) and derives the date of birth. `lib/services/config.ts` holds the R10 fee, the terms version, the 12-month clearance validity, units and labels.
- `POST /api/services/provider` saves each wizard step (`start`, `services`, `profile`, `identity`, `submit`) as the signed-in user, with server-side contact scanning, the 18+ check, a completeness check on submit, an edit lock during review and an identity lock once verified.
- New pages:
  - `/candidate/services`: status, listing switch, rate card, documents, strikes
  - `/candidate/services/enrol`: the 5-step wizard
  - `/admin/service-providers`: the verification queue, with documents opened through 2-minute signed URLs
  - `/services/provider-agreement`: the draft agreement, marked as pending legal review
- An "I offer services" tab on the register page (or `?as=services`). It creates a normal candidate account and leaves `handle_new_user()` untouched. Email-confirmation signups get a nudge on the dashboard.
- Sidebar links ("My Services" for candidates, "Service Providers" for admins), and English and isiZulu strings for the register tab. The isiZulu strings are not yet reviewed by a first-language speaker.

**Checks:** `tsc --noEmit` is clean and `npm run build` passes. ESLint reports two `set-state-in-effect` hits in new code, matching the existing patterns in the same files (CI lint is informational).

**Also found:** existing candidate ID, qualification and transcript files are in the **public** `documents` bucket, so anyone with the link can open them. This is recorded under compliance checklist item 7.

**Still open in S1:** run the migration and test it end to end. A card on `/candidate/profile` isn't added yet. Portfolio photos moved to S2.

## Google sign-in sent existing candidates to "Just one more step", and saving failed

Linda signed in with Google on an account that already had a name and phone, and was shown the onboarding gate. "Save and continue" then failed.

**Diagnosis (read-only, against production):**
- Her account is a single Google identity with `role = candidate`.
- Her `candidate_profiles` row **has** a full name and a phone. `updated_at` equals `created_at`, so no save has ever landed.
- A plain read of `candidate_profiles` through the API fails with `42P17 infinite recursion detected in policy for relation "candidate_profiles"`, and so does `applications`.

**Root cause:** the 13 Aug recursion is back.
- `fix-security-hardening.sql` §5 creates "Companies read applicant profiles" as an inline `EXISTS (... FROM applications ...)`.
- The `applications` policy "Candidates read own applications" reads `candidate_profiles` back, so each policy triggers the other forever.
- `fix-candidate-profile-visibility-recursion.sql` (13 Aug) replaced the inline version with the `company_has_applicant()` SECURITY DEFINER helper. But on 15 Oct every migration was re-run, and the hardening file ran after the fix, restoring the recursive version.
- The middleware's phone gate ignored the query error, so "can't read the profile" looked the same as "no phone". The onboarding upsert then hit the same recursion.

**Fixes:**
- **Production (pending, Linda to run):** run `supabase/fix-candidate-profile-visibility-recursion.sql` again in the SQL Editor.
- `supabase/fix-security-hardening.sql` §5 now defines and uses `company_has_applicant()`, so re-running it in any order is safe. `schema.sql` already used the helper.
- `lib/supabase/middleware.ts` only redirects to onboarding on a successful read with no phone. On an error it logs and lets the request through, since the gate is a UX prompt and RLS does the access control.
- `app/candidate/onboarding/page.tsx` now shows a load error instead of quietly showing blank fields.

**Impact:** the same applies to **every** candidate while the recursion is live: all `/candidate/*` pages, applications, and company views of applicants. It isn't specific to Google sign-in.

## Spanispace Services S2: home page section and public browsing

Linda couldn't find the marketplace on the home screen. S1 had only built the provider side, so the public side (S2) was built next.

- **Home page:** a new `ServicesSection` after the jobs board. It has 8 popular category tiles plus "All services", the 3 steps (find, agree in chat, book with the R10 fee), "Browse services" / "Offer your services" buttons, and a "Bookings open soon" note. It uses a static category list, so it renders before the migration runs. English and isiZulu strings are added.
- **Navbar** "Services" link. **Sitemap** has `/services` plus the 29 category pages.
- **`/services` and `/services/[category]`:** filters for category, province and payment method (a plain GET form), the provider card grid, an empty state that invites providers to sign up, and the marketplace disclaimer.
- **`/services/provider/[id]`:** signed-out visitors see the summary and a sign-in panel. Signed-in users see the bio, the full rate card and availability. "Request a quote" is disabled until S3 (messaging).
- **Database** (`add-service-marketplace.sql` PART F, also mirrored): three `security_barrier` views.
  - `service_provider_cards` is granted to anon.
  - `service_provider_rate_cards` and `service_provider_profiles` are granted to authenticated only, so the summary-only rule is enforced by the database, not just the page.
  - All three only include verified, listed providers with an in-date clearance, and hide regulated categories until the certificate is approved.
- Public reads use a cookie-free anon client (`lib/services/publicData.ts`). The home page was already rendered per request, because its jobs and university fetchers read cookies, so this didn't change its caching.

**Checks:** `tsc` is clean and the build passes. Not tested against a database, since the migration still hasn't been run.

**Not done in S2:** the estimator, portfolio photos, city/radius/price/rating filters, isiZulu for the `/services` pages, and `llms.txt`. `/login` also ignores `?next=`.

## Docs sync

- `docs/ROADMAP.md`: new "Spanispace Services marketplace" row in **What's Built**, covering S1 + S2 status and that the migration hasn't been run.
- `docs/project-details.md`: the §7.11 phase table now has a status column (S0 partly, S1 code done, S2 mostly done, S3–S7 not started). The §1 overview and the §4 business model mention Services and where it stands.

## Spanispace Services S3: requests and guarded messaging

"Request a quote" now works. It needs the new migration `supabase/add-service-requests-messaging.sql`, run after `add-service-marketplace.sql`. Neither has been run yet.

- **Database:** `service_requests`, `service_threads` (one per provider per request, at most 10), `service_messages` and `contact_violations`. They are **read-only for the parties, with no client write policies at all**. Every write goes through the API with the service role after an auth check. That's what makes contact blocking enforceable: a direct PostgREST insert has no policy to pass. The `SECURITY DEFINER` helpers avoid policy recursion (today's lesson). `service_thread_requester_name()` gives providers only the requester's first name.
- **API:**
  - `POST /api/services/requests` creates a request and its first conversation, or adds a provider to an existing open request for the same category. It checks the provider is live and offers the category (with an approved certificate where one is needed), blocks contacting yourself, sends company accounts to S5, and contact-scans every text field.
  - `POST /api/services/messages` is the enforcement point. It scans the message on its own and joined with the sender's last 4 messages (new `scanWithHistory()` in `contactGuard.ts`). Blocked messages are logged and never delivered. It also enforces 20 messages a minute, 2,000 characters, closed-thread and inactive-provider checks.
  - `POST /api/services/threads/[id]` handles read, decline (provider) and close. `POST /api/services/requests/[id]` cancels a request and closes its conversations.
- **UI:**
  - the Request-a-quote form on provider pages
  - `/services/requests` (list) and `/services/requests/[id]` (compare conversations side by side)
  - the chat page `/services/requests/[id]/chat/[threadId]`, shared by both parties: 5-second polling, live warning, decline/close using the app's `useConfirm` dialog
  - the provider inbox `/candidate/services/inbox`, plus an unread card on My Services
  - `/admin/service-violations`
  - sidebar links: "Hire Services" (candidate) and "Contact Violations" (admin)
- `lib/services/messaging-constants.ts` keeps the limits client-safe, since `messaging.ts` imports the service-role client.
- **Tests:** 85/85 contact-guard checks, adding 8 split-message cases (4 must-block, 4 must-allow). `tsc` and ESLint are clean on all the new Services files, and the build passes. Not tested against a database.
- **Not done:** email notifications for new requests (Resend isn't configured), attachments (deliberately off), Realtime (polling for now).

## Files changed

- `docs/project-details.md` (new)
- `docs/ROADMAP.md`: new Phase 2b (Spanispace Services) with the full S0–S7 plan, new milestone, Last Updated date
- `docs/CHANGELOG/20 OCT 2026 - Project details doc, Spanispace Services spec.md` (new)
- `supabase/add-service-marketplace.sql` (new), `supabase/schema.sql`
- `lib/services/config.ts`, `lib/services/contactGuard.ts`, `lib/services/saId.ts` (new)
- `scripts/test-contact-guard.ts` (new)
- `app/api/services/provider/route.ts` (new)
- `app/candidate/services/page.tsx`, `app/candidate/services/ListingToggle.tsx`, `app/candidate/services/enrol/page.tsx`, `app/candidate/services/enrol/EnrolWizard.tsx` (new)
- `app/admin/service-providers/page.tsx` (new)
- `app/(public)/services/provider-agreement/page.tsx` (new)
- `app/(auth)/register/page.tsx`, `app/candidate/dashboard/page.tsx`
- `components/candidate/CandidateSidebar.tsx`, `components/admin/AdminSidebar.tsx`
- `lib/i18n/en.ts`, `lib/i18n/zu.ts`
- `supabase/fix-security-hardening.sql`, `lib/supabase/middleware.ts`, `app/candidate/onboarding/page.tsx`
- `components/ServicesSection.tsx`, `components/services/ProviderCardView.tsx`, `components/services/ServicesBrowser.tsx`, `lib/services/publicData.ts` (new)
- `app/(public)/services/page.tsx`, `app/(public)/services/[category]/page.tsx`, `app/(public)/services/provider/[id]/page.tsx` (new)
- `app/(public)/page.tsx`, `components/Navbar.tsx`, `app/sitemap.ts`
- `supabase/add-service-requests-messaging.sql` (new), `supabase/schema.sql`
- `lib/services/messaging.ts`, `lib/services/messaging-constants.ts` (new), `lib/services/contactGuard.ts`, `scripts/test-contact-guard.ts`
- `app/api/services/requests/route.ts`, `app/api/services/requests/[id]/route.ts`, `app/api/services/messages/route.ts`, `app/api/services/threads/[id]/route.ts` (new)
- `components/services/RequestQuoteForm.tsx`, `components/services/ServiceChat.tsx` (new)
- `app/(public)/services/requests/page.tsx`, `app/(public)/services/requests/[id]/page.tsx`, `app/(public)/services/requests/[id]/CancelRequestButton.tsx`, `app/(public)/services/requests/[id]/chat/[threadId]/page.tsx` (new)
- `app/candidate/services/inbox/page.tsx`, `app/admin/service-violations/page.tsx` (new); `app/(public)/services/provider/[id]/page.tsx`, `app/candidate/services/page.tsx`, `components/candidate/CandidateSidebar.tsx`, `components/admin/AdminSidebar.tsx`
