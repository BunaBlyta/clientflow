### 2026-08-17 11:27 — Agent A — resolve production Stripe configuration

Changed:
- Identified two separate production configuration mismatches: Vercel first
  used API keys from the wrong Stripe environment, then used a stale webhook
  signing secret.
- Safely reset only the `$999` Jordan test invoice during diagnosis so a new
  Checkout form could be opened without paying, then verified the new session
  appeared in the correct Stripe account before allowing payment.
- After Buna copied the signing secret from the exact endpoint and redeployed,
  resent the already-paid event once and confirmed the invoice became Paid.

Tried and abandoned (what didn't work, and why):
- Repeatedly copying credentials from an uncertain Stripe dashboard context did
  not align the API account. Copying the verified local API keys to Vercel did.
- Copying the local webhook signing secret to Vercel produced HTTP 400 because
  that local value was stale. The signing secret had to come from the exact
  saved webhook endpoint.
- Direct diagnostic requests from this machine to Vercel timed out because of
  the known local network path problem. Stripe delivery status and production
  database state provided the authoritative checks instead.

Left for next session:
- Refresh both user interfaces and confirm the invoice displays Paid.
- Update local `.env` with the corrected endpoint signing secret without
  committing it.
- On a later fresh payment, confirm automatic delivery returns HTTP 200; the
  corrected recovery resend already proves the endpoint accepts Stripe's
  signature and performs the paid transition.

Assumptions made (flag if wrong):
- The `$999` Jordan invoice was sandbox-only test data and the repeated guarded
  resets were within Buna's approval for this diagnosis.

Blockers:
- None. The paid event is delivered and the production invoice is Paid.
