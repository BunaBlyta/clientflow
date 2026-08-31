### 2026-08-14 09:08 — Agent A — Flow A payment and approval integrity

Changed:
- Made request approval claim the pending request before creating account and
  payment records, preventing duplicate projects and invoices when two staff
  actions arrive together.
- Rejected standard requests whose email belongs to a staff account instead of
  attaching a client record to that staff user.
- Enforced the invoice state machine before Stripe checkout and restricted
  signed payment webhooks to `PAYMENT_PENDING` invoices.
- Made successful webhook delivery idempotent under concurrent delivery, and
  added tests for the approval and payment race conditions.
- Updated `docs/ARCHITECTURE.md` with the new invariants and contracts.

Tried and abandoned (what didn't work, and why):
- Tried to run `npx prettier --check`, but Prettier is not installed in this
  repository and the command began resolving through `npx`. It was stopped so
  no package install or network dependency change could occur. ESLint passed.
- The normal Turbopack production build hit the known sandbox restriction when
  binding a worker port. The documented webpack build passed instead.

Left for next session:
- No API code blocker. Buna should repeat a real Neon approval and Stripe
  webhook walkthrough before the Friday demo if time allows.

Assumptions made (flag if wrong):
- Stripe checkout must begin only from `SENT`, `PAYMENT_PENDING`, or `FAILED`,
  because `DRAFT` → `PAYMENT_PENDING` skips the existing invoice state machine.
- A request using a staff email is an account conflict, not a request to turn
  that staff account into a client.

Blockers:
- No live Neon verification was run in this sandbox. No schema migration is
  required.
