# CURRENT — API & database lane (Agent A)

Last updated: 2026-08-17 15:48 by Codex — harden push delivery and concurrent writes

## What changed

- Device token registration now runs in a transaction. If a token moves to a
  different account, pending deliveries for the old account are failed before
  transfer. Logout deactivates the device and fails its pending deliveries in
  the same transaction.
- Expo dispatch only selects active devices, drains all due pending deliveries,
  opportunistically checks outstanding receipts, preserves ticket and receipt
  state separately, and leaves not-ready receipts pending.
- Expo `DeviceNotRegistered` errors deactivate the device whether reported in a
  ticket or receipt. Network errors, invalid responses, and non-2xx responses
  release claims with bounded backoff and a five-attempt ceiling.
- Payment reconciliation now uses an atomic transaction, the shared
  notification/outbox creator, and the same client-plus-active-staff failure
  notification behavior as the Stripe webhook.
- Invoice `DRAFT → SENT` and manual project status changes now claim the old
  state with a conditional update inside their transaction. A competing write
  receives 409 and cannot duplicate notifications or system notes.
- Added focused privacy, receipt lifecycle, retry, reconciliation, and
  concurrency tests.

## Verification

- `npm run verify` passed typecheck, lint, and tests: 38 files, 172 tests.
- The default Turbopack build still hits the known sandbox-only process/
  port-binding panic.
- `node_modules/.bin/next build --webpack` passed and included all API routes.
- Lint has two pre-existing `@next/next/no-img-element` warnings in
  `components/marketing/mobile-app-section.tsx`.

## Handoff

- Previous realtime implementation commit: `a427bf6`.
- This hardening patch is ready to commit and push after final review.
- Real Expo delivery still requires EAS/APNs credentials and a physical iPhone;
  Ably delivery still requires `ABLY_API_KEY` in local/Vercel environments.
