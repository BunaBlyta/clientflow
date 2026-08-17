### 2026-08-17 10:47 — Agent A — production Stripe delivery diagnosis

Changed:
- Recorded that the successful payment event predated the production webhook
  destination by about 14 minutes, so it required the manual resend.
- Verified the destination is now enabled with the correct Vercel URL and event
  subscriptions, and that the resent event has no pending webhook deliveries.

Tried and abandoned (what didn't work, and why):
- Direct HEAD requests to the Vercel routes timed out from the current network,
  matching the already known network-specific Vercel connectivity problem.

Left for next session:
- Run one new clean card payment and confirm its Checkout event is delivered
  automatically. Do not create another payment if that event remains pending.
- Consider requiring `payment_status = paid` in the Checkout webhook handler
  before delayed payment methods are enabled.

Assumptions made (flag if wrong):
- The Stripe CLI is authenticated to the same sandbox account used by the
  deployed app; the matching event, metadata, URL, and destination support this.

Blockers:
- None for the original incident. A new payment is needed only for final
  automatic-delivery confirmation.
