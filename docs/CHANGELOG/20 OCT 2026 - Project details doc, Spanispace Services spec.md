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

## Files changed

- `docs/project-details.md` (new)
- `docs/ROADMAP.md`: new Phase 2b (Spanispace Services) with the full S0–S7 plan, new milestone, Last Updated date
- `docs/CHANGELOG/20 OCT 2026 - Project details doc, Spanispace Services spec.md` (new)
