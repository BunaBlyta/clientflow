# CURRENT — API & database lane (Agent A)

Last updated: 2026-08-28 08:52 by Codex — Stripe payment hardening

## What changed

- Checkout creation now has one database-claimed `stripeCheckoutAttemptId` per
  attempt and sends that value as Stripe's idempotency key. Concurrent retries
  and a server crash after Stripe creates a Session recover the same Session
  instead of creating another payable link.
- Existing Checkout Sessions are returned only when Stripe says they are open
  and both their success and cancel URLs match the current invoice, attempt and
  web/mobile channel. An open Session is expired before it is replaced.
- Stripe cancel redirects now pass through
  `GET /api/stripe/checkout/cancel`. The opaque current attempt ID prevents an
  old cancel link from expiring a newer Session. An open Session is expired and
  the invoice becomes Failed before the user sees the cancellation page. If
  Stripe already says it is paid, normal payment settlement wins instead.
- Voiding a Payment Pending invoice now fails closed: Stripe must confirm the
  Session is expired or successfully expire it first. Paid and processing
  Sessions cannot be voided; Stripe lookup or expiration failures leave the
  invoice unchanged.
- Explicit invoice reconciliation now repairs both directions. A Stripe Session
  reported paid runs the same idempotent settlement transaction as a webhook;
  an expired Session or failed PaymentIntent runs the shared failure transaction.
  Ordinary reads still never call Stripe.
- Real PaymentIntent webhook objects now store `object.id` as the PaymentIntent
  ID and preserve the Checkout Session ID. Checkout Session events continue to
  store both identifiers from their own object shape.
- Payment success/failure transactions were moved into one shared helper so the
  webhook, cancellation, void-race check and reconciliation produce identical,
  once-only project, activity and notification side effects.
- Fixed two pre-existing API verification blockers found by the production
  build: the translation Route Handler no longer exports an unsupported test
  constant, and the end-to-end verification test now reflects the current
  registration and client-profile response contracts.

## Verification

- Focused Stripe/invoice suite: 6 files and 62 tests passed.
- Full Vitest suite: 41 files and 218 tests passed.
- `npx tsc --noEmit`: passed.
- `npx eslint app/api`: passed.
- `npx prisma validate` and `npx prisma generate`: passed.
- `npx next build --webpack`: passed and generated all 39 routes.
- `npm run verify` was run twice. It stops at two pre-existing web-lane lint
  errors in `components/dashboard/date-picker.tsx` and
  `components/dashboard/settings-content.tsx`; those files were not changed.
- The default Turbopack build also cannot bind its internal CSS worker port in
  this execution environment, even outside the normal sandbox. The supported
  webpack fallback completed successfully.

## Migration

The Checkout attempt column and unique index are prepared but not applied to
Neon. The earlier notification archive migration is also still pending. Buna
must run this exact command once from the repository root after reviewing both:

```text
npx prisma migrate deploy
```

Do not run it concurrently with another migration.

## API contract handoff

- `POST /api/stripe/checkout` keeps the same request/response shape. Its Stripe
  cancel URL now targets the new API cancellation route, and it can return 502
  when an existing Session cannot be safely verified or expired.
- `GET /api/invoices/:id?reconcilePayment=true` may now change a verified paid
  Session to Paid, including project advancement for Deposit/Custom invoices.
  It still requires authentication and invoice ownership for clients.
- `PATCH /api/invoices/:id` with `VOIDED` can now call Stripe when the current
  invoice is Payment Pending. Staff should keep the existing error response
  visible when a payment is already paid, still processing, or Stripe is
  temporarily unreachable.
- The migration is
  `prisma/migrations/20260828083000_add_stripe_checkout_attempt/migration.sql`.

## Cross-lane follow-up

- Web-owned cancellation copy in `lib/i18n.tsx` still says the invoice is
  unchanged. It should say no payment was taken and the invoice is ready to
  retry, because cancellation now moves Payment Pending to Failed.
- Buna should align the webhook-only wording in `AGENTS.md` and `docs/SPEC.md`
  with the requested resilience rule now recorded in `docs/ARCHITECTURE.md`:
  signed webhooks remain primary, while explicit authenticated reconciliation
  may use the stored Session's direct Stripe state to repair a missed delivery.
- Refund synchronization, disputes, partial payments and subscriptions remain
  intentionally out of scope.
