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

## Files changed

- `docs/project-details.md` (new)
- `docs/ROADMAP.md`: new Phase 2b (Spanispace Services), Last Updated date
- `docs/CHANGELOG/20 OCT 2026 - Project details doc, Spanispace Services spec.md` (new)
