# CURRENT — API & database lane (Agent A)

Last updated: 2026-08-17 15:35 by Codex — push and Ably realtime delivery

## What changed

- Added `PushDevice`, `PushDelivery`, and `PushDeliveryStatus` to Prisma. The
  migration `20260817132932_add_push_devices_and_delivery_outbox` has been
  applied and Prisma Client has been regenerated.
- Added authenticated iOS device registration and deactivation at
  `POST/DELETE /api/notifications/devices`.
- Added `GET /api/realtime/token`, returning a five-minute, subscribe-only
  Ably token scoped to the current user's channel and the staff channel for
  staff accounts.
- Centralized notification creation. Each active device receives a durable
  push-delivery outbox row in the same database transaction as its inbox row.
- Added Expo push dispatch, retry claims, ticket/receipt handling, and
  deactivation for unregistered devices. Provider calls happen after the
  transaction through Next.js `after()`.
- Added Ably `notification.created` events on per-user channels and
  `entity.changed` invalidation hints on the staff channel.
- Updated invoice, payment/webhook, project status, notes, request,
  contact-lead, and payment-reconciliation side effects. Draft invoices do not
  notify; sending an invoice emits exactly one invoice notification, and extra
  invoices use `EXTRA_CHARGE_CREATED`.
- Payment success/failure now notifies the client and active staff. Deposit
  payment does not create a second stage notification.
- Notes notify only the opposite side and only active staff recipients.
- Updated `docs/ARCHITECTURE.md` with the delivery contract and recovery model.

## Verification

- `npm run typecheck` passed.
- `npm run lint` passed with two existing `@next/next/no-img-element`
  warnings in `components/marketing/mobile-app-section.tsx`.
- `npm test -- --reporter=dot` passed: 37 files, 163 tests.
- `npm run verify` passed typecheck, lint, and tests, then hit the known
  sandbox-only Turbopack process/port-binding panic during `next build`.
- `node_modules/.bin/next build --webpack` passed and included both new API
  routes.

## External setup still required

- Set `ABLY_API_KEY` in local/Vercel server environments for web realtime.
- Expo can send without an access token, but `EXPO_ACCESS_TOKEN` should be set
  if Expo project access-token protection is enabled.
- A physical iPhone and configured APNs/EAS credentials are still required to
  prove iOS push delivery; push permission is optional and the durable inbox
  remains the fallback.

## Handoff

- Frontends should consume `/api/realtime/token`, subscribe to the documented
  channels, and refetch authoritative data after events.
- Do not mark a payment paid from a push or Ably event; the verified Stripe
  webhook remains authoritative.
