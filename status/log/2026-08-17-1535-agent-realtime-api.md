### 2026-08-17 15:35 — Codex — API push and Ably realtime

Changed:
- Added iOS Expo device registration, durable push-delivery outbox records,
  Expo ticket/receipt handling, and retries.
- Added scoped Ably token requests and post-transaction realtime events.
- Centralized notification creation and updated invoice, payment, project,
  notes, request, contact inquiry, and reconciliation side effects.
- Added tests for device registration, realtime token access, draft invoice
  behavior, and extra-invoice notification behavior.
- Applied the Prisma migration and regenerated the client.

Tried and abandoned (what didn't work, and why):
- The default Turbopack production build still fails in this sandbox because
  its worker cannot bind a process port. The Webpack build succeeds.

Left for next session:
- Configure `ABLY_API_KEY` in local/Vercel environments and test a real Ably
  browser connection.
- Build and test an iOS EAS development build with APNs credentials and a real
  device.

Assumptions made (flag if wrong):
- Only iOS Expo tokens are registered; the API accepts the mobile app's `IOS`
  spelling and stores the normalized `ios` platform value.
- Ably events are invalidation hints; clients refetch the database-backed API
  response after receiving them.

Blockers:
- No API code blocker remains. Real push delivery requires external Ably/EAS
  credentials and a physical iPhone.
