# CURRENT — API & database lane (Agent A)

Last updated: 2026-08-17 10:47 by Codex — diagnose production Stripe delivery

## What changed

- No API or database code changed. The reported pending-payment incident was a
  Stripe destination timing issue rather than an application bug.
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

## Handoff

- Future Checkout events should be delivered automatically because the
  destination now exists and is enabled. One new clean payment is still needed
  to prove automatic delivery after destination creation.
- If that payment remains pending, inspect its own
  `checkout.session.completed` delivery before retrying or creating another
  payment.
- Separate hardening opportunity: the webhook handler should verify a Checkout
  Session is paid before marking an invoice paid, especially before enabling
  delayed payment methods. This did not cause the reported card-payment issue.
