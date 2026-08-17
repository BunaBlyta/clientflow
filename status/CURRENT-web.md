# CURRENT — web UI lane (Agent B)

Last updated: 2026-08-17 15:14 by Codex — staff web realtime notifications

## Current state

- Added one dashboard-level `DashboardRealtimeProvider`. It authenticates to
  `GET /api/realtime/token`, subscribes to `clientflow:user:<id>` and
  `clientflow:staff`, and listens for `notification.created` and
  `entity.changed` messages.
- Added a dedicated Zustand notification store in
  `lib/realtime-notification-store.ts`. The store owns the shared list,
  loading/error state, connection state, authoritative read actions, merge and
  deduplication behavior, and cross-tab read synchronization.
- Consolidated the topbar bell and the notifications page onto that store, so
  both surfaces show the same live list and unread count. New remote records
  produce one toast; duplicate events and initial/reconnect catch-up do not.
- Realtime entity events are treated as refetch hints only. Debounced browser
  events refresh the overview, analytics, invoice list, project list, and the
  matching project detail page through their existing API loaders. Invoice and
  payment state remains server-authoritative.
- The provider catches up on initial load, Ably reconnect, window focus,
  visibility changes, and explicit refresh. It polls notifications every 30
  seconds only while the connection is degraded.
- Added Node-friendly pure tests for notification sorting, ID deduplication,
  canonical payload validation, and entity-event validation.

## Verification

- `npx vitest run lib/realtime-notification-store.test.ts`: passed (3 tests).
- `npm run lint`: passed with two pre-existing warnings in
  `components/marketing/mobile-app-section.tsx` for raw `<img>` elements.
- `git diff --check`: passed for web-owned changes.
- `npm run typecheck`: currently blocked by concurrent API-lane work outside
  this lane: generated Prisma client lacks `pushDevice`/`pushDelivery`, and
  Stripe webhook `result` narrowing is incomplete. No web-owned type errors
  were reported.

## Handoff notes

- The API lane must keep `GET /api/realtime/token` returning a direct Ably
  TokenRequest (or a `{ tokenRequest }`/`{ tokenDetails }` wrapper) and grant
  staff subscribe capability to both the per-user and `clientflow:staff`
  channels. The provider accepts either direct or wrapped token responses.
- `notification.created` should carry the existing web `Notification` shape:
  `id`, `userId`, `type`, `title`, `body`, `read`, `createdAt`, and optional
  `projectId`, `invoiceId`, `requestId`.
- `entity.changed` should carry `entity`, `reason`, and the relevant project
  and/or invoice IDs. Payload state is deliberately not applied directly.
- Ably and API changes from other lanes are intentionally not included in the
  web commit. Do not edit `STATUS.md` or another lane's status file.

