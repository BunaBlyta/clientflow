# CURRENT — API & database lane (Agent A)

Last updated: 2026-08-14 09:08 by Codex — harden Flow A payment and approval integrity

## What changed

- Made request approval claim the `PENDING` request atomically before creating
  the client, project, deposit invoice, and approval notification. A competing
  approval now returns 409 and cannot create duplicates.
- Prevented a standard request from attaching a client record to an existing
  staff account; that email conflict returns 409 and rolls the transaction back.
- Made Stripe checkout use the shared invoice state rules. Draft invoices must
  be sent before checkout, reusable sessions still move the invoice to
  `PAYMENT_PENDING`, and new sessions use the same state transition.
- Made success and failure webhook updates conditional on
  `PAYMENT_PENDING`. Duplicate or concurrent deliveries cannot repeat the paid
  state, project Discovery transition, audit note, or notification, and an
  invoice in another state is left unchanged.
- Added regression tests for approval races, staff-email conflicts, draft
  checkout rejection, webhook idempotency, and invalid payment-state changes.
- Documented these API invariants in `docs/ARCHITECTURE.md`.

## Verification

- `npm run test` — passed: 34 files, 145 tests.
- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm run verify` — typecheck, lint, and tests passed; the Turbopack build
  hit the known sandbox-only port-binding restriction.
- `npx next build --webpack` — passed; all routes compiled.
- `git diff --check` — passed.
- No Prisma schema change, migration, install, or live database mutation was
  needed for this task.

## Handoff

- The API still uses the existing invoice lifecycle: `SENT` →
  `PAYMENT_PENDING` → `PAID` or `FAILED`, with Stripe's signed webhook as the
  only confirmation path.
- The two modified mobile files and other agents' staged files were not
  touched or staged by this lane.
- A live Neon payment/approval walkthrough was not repeated in this sandbox;
  the new behavior is covered by the focused route tests and the full suite.
