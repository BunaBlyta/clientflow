### 2026-08-17 11:02 — Agent A — Stripe account mismatch diagnosis

Changed:
- Identified that Vercel creates Checkout Sessions in a different Stripe
  sandbox/account from the one containing the production webhook destination.
- Verified the newest Jordan invoice is pending and has a new Checkout Session
  ID, while both the local Stripe CLI and local API key return `resource_missing`
  for that ID.

Tried and abandoned (what didn't work, and why):
- Looking for the new Checkout event in the webhook destination's account could
  not work because the new session was created in a different account.
- The first read-only Prisma query attempts used the wrong generated-module
  loader and then unsupported top-level await; wrapping the installed TypeScript
  runner query in an async function worked.

Left for next session:
- In the Stripe sandbox that shows the newest payment, create a webhook
  destination for the production URL and expected three events.
- Set that destination's signing secret as Vercel's
  `STRIPE_WEBHOOK_SECRET`, redeploy, then resend the existing completed Checkout
  event. Do not make a second payment before this recovery.

Assumptions made (flag if wrong):
- The newest `$999` Jordan invoice is the payment currently being tested; its
  update time and newly stored Checkout Session match the reported attempt.

Blockers:
- The Stripe destination and Vercel secret must be aligned by Buna because
  Codex does not have access to the Vercel project settings or the other Stripe
  sandbox.
