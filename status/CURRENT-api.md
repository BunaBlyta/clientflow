# CURRENT — API & database lane (Agent A)

Last updated: 2026-08-17 14:08 by Codex — reconcile abandoned Stripe sessions

## What changed

- No API or database code changed. The production Stripe failure was caused by
  mismatched Vercel credentials, not the webhook implementation.
- Proved Vercel initially created Checkout Sessions in a Stripe environment
  different from account `acct_1U2x49HZ4FnNiDXG`, where the Clientflow webhook
  destination exists. Newly stored session IDs returned `resource_missing` in
  the webhook account.
- Aligned Vercel's production Stripe secret and publishable keys with the
  verified local API keys. A new open `$999` Checkout Session then appeared in
  the correct account with the expected invoice and project metadata.
- The first automatic delivery of the paid event reached the endpoint but
  returned HTTP 400 because Vercel's webhook signing secret was stale. Buna
  replaced only `STRIPE_WEBHOOK_SECRET` with the signing secret revealed from
  the exact saved endpoint and redeployed.
- Resent the already-paid event once after that correction. The delivery
  completed and the webhook changed Jordan's `$999` invoice to `PAID`.
- During diagnosis, with Buna's approval, reset only that test invoice to
  `FAILED` and cleared its unusable session reference before each safe retry.
  Every production update was guarded by exact invoice ID, client email,
  amount, and current status checks.
- In a one-time cross-lane exception explicitly authorized by Buna, simplified
  the web success page shown after a mobile Checkout. It now displays only the
  success icon and “You may return to the Clientflow app,” with no web-app
  button or development explanation. Web-originated payments still show their
  existing invoice-dashboard action. Added equivalent German and Albanian text.
- Fixed the deployed AI analytics insight 502 by replacing Groq's retired
  `llama-3.3-70b-versatile` model with its recommended production replacement,
  `openai/gpt-oss-120b`. The existing API response contract is unchanged.
- Confirmed the configured Groq key authenticates and the replacement model
  returns a valid completion. The retired model returned 404 `model_not_found`.
- Fixed declined-card handling: new Checkout Sessions now copy invoice and
  project metadata onto the PaymentIntent as well as the Checkout Session, so
  `payment_intent.payment_failed` webhooks can identify and mark the invoice
  `FAILED`.
- Added a checkout-route regression test for the PaymentIntent metadata.

## Verification

- New Checkout Session
  `cs_test_a1zVGucb2AWau5BaLtf3jS4gSeeccnhm36NgjeAtdTnDgRg34L6PC4A2pa` appeared
  in the webhook's Stripe account as an open `$999` session before payment.
- Stripe event `evt_1U5MgtHZ4FnNiDXGpqN0bpF0` is a paid, complete
  `checkout.session.completed` event with the expected invoice metadata.
- After the corrected signing secret deployment and one recovery resend, the
  event reports `pending_webhooks: 0`.
- Production invoice `cmswzttmy000004l40zmnrg4i` is `PAID`, has `paidAt` set,
  and stores both the matching Checkout Session and Payment Intent IDs.
- Mobile success-page change: typecheck passed, lint passed with two pre-existing
  `<img>` warnings, and all 34 files / 145 tests passed.
- `npm run verify` reached the build but Turbopack hit its known sandbox-only
  process/port-binding panic. `node_modules/.bin/next build --webpack` passed
  and compiled all routes, including `/payment/success`.
- Groq insight change: focused route suite passed all 6 tests; full typecheck,
  lint, and all 34 files / 145 tests passed. Turbopack repeated the known
  sandbox port panic, and `node_modules/.bin/next build --webpack` passed.

## Handoff

- Production Stripe API keys and endpoint signing secret are now aligned.
  Future events should deliver automatically; manual resend was needed only to
  recover the event whose first automatic attempt used the stale signing
  secret.
- Refresh the web dashboard and mobile invoice to confirm both surfaces display
  Paid.
- The local `.env` webhook signing secret may still be stale because the
  corrected `whsec_...` value was copied directly from Stripe to Vercel. Buna
  should update local `.env` from that same endpoint before relying on it for a
  production-endpoint signature check. Do not commit the secret.
- Separate hardening opportunity remains: require a paid Checkout Session in
  the webhook handler before marking an invoice paid, especially before delayed
  payment methods are enabled.
- Existing Checkout Sessions created before this fix do not gain the new
  PaymentIntent metadata. A fresh checkout attempt is required to exercise the
  corrected failure path.
- Added opt-in invoice reconciliation via `GET /api/invoices/[id]?reconcilePayment=true`.
  It checks the existing Checkout Session and marks a pending invoice failed
  only when Stripe reports an expired session or a PaymentIntent back at
  `requires_payment_method`/`canceled`; genuine `processing` remains pending.
- Added API coverage for abandoned, processing, and ordinary invoice reads.
- The mobile success-page edit touched `app/payment/success/page.tsx` and
  `lib/i18n.tsx` only under Buna's explicit one-time authorization. No Web lane
  state file was changed.
- The local Groq key was accidentally printed by a diagnostic command and must
  be treated as exposed. Buna must rotate it in Groq, replace `GROQ_API_KEY` in
  Vercel Production and local `.env`, then redeploy. Never commit either value.
