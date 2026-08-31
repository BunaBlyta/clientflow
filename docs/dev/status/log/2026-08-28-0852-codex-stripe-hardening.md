### 2026-08-28 08:52 — Codex — Stripe payment hardening

Changed:
- Prevented duplicate payable Checkout Sessions with database claims, Stripe
  idempotency keys, open-session validation and expiration-before-replacement.
- Made client cancellation and staff voiding close the active Stripe Session
  before changing invoice state.
- Added safe paid-payment reconciliation for missed webhooks and corrected real
  PaymentIntent event ID handling.
- Centralized once-only payment settlement side effects and documented the new
  API contract.
- Added the Checkout attempt migration and expanded payment coverage to 62
  focused tests; the full 218-test suite and webpack production build pass.
- Prisma schema validation and client generation pass with the new field.
- Fixed stale translation/auth verification checks that blocked the API build
  and full test suite.

Tried and abandoned (what didn't work, and why):
- The default `npm run build` Turbopack path cannot bind its internal CSS worker
  port in this environment, including with elevated execution. The supported
  webpack build path completed successfully instead.
- `npm run verify` still cannot finish because two existing web-owned components
  fail React effect lint rules. They were left to their owning lane.

Left for next session:
- Buna must apply the pending Prisma migrations.
- The web lane should update cancellation wording that still says the invoice is
  unchanged.
- Buna should align `AGENTS.md` and `docs/SPEC.md` wording with the explicit
  server-to-server Stripe reconciliation exception.

Assumptions made (flag if wrong):
- "Handle these" meant hardening the existing one-time invoice flow. Refunds,
  disputes, partial payments and subscriptions remain out of scope.
- A direct authenticated server retrieval of the stored Stripe Checkout Session
  is acceptable authoritative evidence for repairing a missed webhook; it never
  trusts the browser redirect or client-supplied payment status.

Blockers:
- Neon does not have `stripeCheckoutAttemptId` until Buna runs
  `npx prisma migrate deploy` once, non-concurrently.
