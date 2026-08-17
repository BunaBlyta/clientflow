# CURRENT — API & database lane (Agent A)

Last updated: 2026-08-17 11:10 by Codex — prepare safe Stripe retry

## What changed

- No API or database code changed. The repeated production payment failure is
  caused by Stripe account/sandbox configuration, not the webhook route.
- Confirmed through the Stripe API that production destination
  `we_1U5LJEHZ4FnNiDXGQZTUqgCP` is enabled, points to
  `https://clientflow-ijdn.vercel.app/api/stripe/webhook`, and subscribes to
  `checkout.session.completed`, `payment_intent.succeeded`, and
  `payment_intent.payment_failed`.
- Confirmed the successful Checkout event was created at 09:36:12 CEST, while
  the webhook destination was created later at 09:50:16 CEST. Stripe therefore
  could not automatically deliver that earlier event to this destination.
- Confirmed the manual resend finished processing: the event now reports zero
  pending webhook deliveries and contains the expected invoice metadata.
- Confirmed the new Jordan invoice (`cmswzttmy000004l40zmnrg4i`) reached
  `PAYMENT_PENDING` and stored Checkout Session
  `cs_test_a1WtBuY9UJ6Q9j2Ce4Uyeg8ZkqbvJCHAb66k2qvaPhSIYcnEm7fBaCnk`.
- Confirmed that new session does not exist in Stripe account
  `acct_1U2x49HZ4FnNiDXG`, even though that is the account containing the saved
  webhook destination and the account used by both the local Stripe CLI and
  local `STRIPE_SECRET_KEY`. Vercel is therefore creating Checkout Sessions in
  a different Stripe sandbox/account from the configured webhook destination.
- With Buna's approval, reset only Jordan's `$999` test invoice
  (`cmswzttmy000004l40zmnrg4i`) from `PAYMENT_PENDING` to `FAILED` and cleared
  its unusable Checkout Session and Payment Intent references. This makes the
  mobile app expose Retry payment and guarantees the next attempt creates a new
  session rather than reusing the mismatched one.

## Verification

- `stripe webhook_endpoints retrieve we_1U5LJEHZ4FnNiDXGQZTUqgCP` — destination
  enabled with the correct URL and three expected event types.
- `stripe events retrieve evt_1U5L5dHZ4FnNiDXG2903bDoh` — event is a paid,
  complete Checkout Session with the expected invoice ID and
  `pending_webhooks: 0`.
- No tests or build were run because no source file changed.
- Direct route probes from this machine timed out due to the previously known
  network path problem reaching Vercel; Stripe's successful delivery is the
  stronger end-to-end server check.
- Read-only database query — newest Jordan invoice is pending with a new Stripe
  session ID.
- Read-only Stripe session lookup from both the CLI and local API key — returned
  `resource_missing` for that new ID, proving the account mismatch.
- Guarded production database update — matched the exact invoice ID, Jordan's
  email, `$999` amount, and `PAYMENT_PENDING` state before changing one row;
  verified the resulting state is `FAILED` with both Stripe IDs empty.

## Handoff

- Reopen the `$999` invoice in mobile, tap Retry payment, and stop when the
  Stripe form opens without entering card details. Then inspect the newly
  created session through the configured Stripe account before paying.
- If the new session appears in account `acct_1U2x49HZ4FnNiDXG`, the Vercel
  key alignment is fixed and the test payment can continue. If it does not,
  production is still using an inaccessible or stale Stripe key.
- Separate hardening opportunity: the webhook handler should verify a Checkout
  Session is paid before marking an invoice paid, especially before enabling
  delayed payment methods. This did not cause the reported card-payment issue.
