# CURRENT — API & database lane (Agent A)

Last updated: 2026-08-12 by Agent A — rejection email

## Completed

- Verification-code checking is read-only, and codes remain available until
  the password is set. Codes last 30 minutes so a client has time to read the
  onboarding email.
- Approving a request creates the client, a readable pending project, and a
  sent deposit invoice together. Staff and clients receive the relevant
  request, approval, invoice, rejection, and project-stage notifications.
- Rejecting a request now emails the prospect even when they have never had a
  Clientflow account. A linked client still receives the existing in-app
  rejection notification as well.
- Demo seed data includes a pending Full Website project, its sent deposit
  invoice, and an unread staff request notification. The shared database was
  not reseeded by this lane.
- The API has the shipped write routes for invoices, notes, notifications,
  packages, current-user details, staff invitation resend, and logout.
  Invoice notifications use `INVOICE_ISSUED` for DEPOSIT, FINAL, and CUSTOM
  invoices, and `EXTRA_CHARGE_CREATED` for EXTRA invoices.
- Stripe webhook tests cover successful payments, deposit-only project
  advancement, duplicate delivery safety, failed payments, paid-invoice
  failure no-ops, and signature rejection.

## Verification

- `npm run verify` passed typecheck, lint, and all 67 tests. Its normal
  Turbopack build hit the documented sandbox-only port-binding restriction
  while processing the other lane's `app/globals.css`.
- `npx next build --webpack` passed and generated all 29 routes.

## Handoff

The API and database work is committed and pushed in small changes. Buna's
remaining work is frontend wiring, live Neon readback, and final end-to-end
testing. No schema migration was needed for rejection email delivery.
