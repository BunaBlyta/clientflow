# CURRENT — API & database lane (Agent A)

Last updated: 2026-08-12 by Agent A — Stripe webhook idempotency tests

## Completed

- Verification-code checking is read-only, and codes remain available until
  the password is set. Codes last 30 minutes so a client has time to read the
  onboarding email.
- Approving a request creates the client, a readable pending project, and a
  sent deposit invoice together. Staff and clients receive the relevant
  request, approval, invoice, rejection, and project-stage notifications.
- Demo seed data includes a pending Full Website project, its sent deposit
  invoice, and an unread staff request notification. The shared database was
  not reseeded by this lane.
- The API has the shipped write routes for invoices, notes, notifications,
  packages, current-user details, and staff invitation resend. Invoice
  notifications use `INVOICE_ISSUED` for DEPOSIT, FINAL, and CUSTOM invoices,
  and `EXTRA_CHARGE_CREATED` for EXTRA invoices.
- Added route tests for the Stripe webhook. They prove successful checkout
  payment, deposit-only project advancement, one success notification,
  duplicate delivery safety, failed payment handling, paid-invoice failure
  no-ops, and missing or invalid signature rejection.

## Verification

- `npm run verify` passed typecheck, lint, and all 65 tests. Its normal
  Turbopack build hit the documented sandbox-only port-binding restriction
  while processing the other lane's `app/globals.css`.
- `npx next build --webpack` passed and generated all 28 routes, including the
  Stripe webhook.

## Handoff

The API and database work is committed and pushed in small changes. Buna's
remaining work is live Neon readback, frontend wiring, and final end-to-end
testing. No schema migration was needed for the webhook tests.
