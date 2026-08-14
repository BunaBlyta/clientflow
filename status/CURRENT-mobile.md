# CURRENT — mobile lane (Agent C)

Last updated: 2026-08-14 09:12 by Codex — restore native iPhone tab sizing

## Current state

- The Expo client has live login, verification-code onboarding, projects,
  project status tracking, shared notes, invoices, Stripe Checkout, and in-app
  notifications. Push notifications remain deliberately cut from v1.
- Account and Notifications are headerless bottom-tab screens. Their content
  starts below the iPhone status bar using the device's safe-area inset.
- The bottom tab layout now leaves height and vertical padding to Expo Router's
  native iOS tab-bar sizing. Expo Router calculates 49px of tab content plus
  the device bottom inset and applies that inset internally, avoiding the
  oversized footer caused by a custom height.
- The app still uses `http://localhost:3000` unless
  `EXPO_PUBLIC_API_URL` is set to a reachable web/API origin.

## Latest change

- Removed the custom tab-bar height and item padding overrides.
- Updated Account's scroll clearance to match the native 49px tab content plus
  the bottom safe-area inset.

## Verification

- `cd mobile && npx tsc --noEmit` under Node 22.23.2: passed.
- `cd mobile && npx expo start --web` under Node 22.23.2: started successfully;
  `http://127.0.0.1:8081` returned HTTP 200. The temporary server was stopped
  after the smoke check.
- Root `npm run test`: passed — 34 test files, 145 tests.
- Root `npm run typecheck`: passed.
- Root `npm run lint`: passed.
- `git diff --check` for the mobile change: passed.
- No physical iPhone, simulator, or in-app browser screenshot was available in
  this session.

## Next work / known limits

- The request-status screen still uses fixtures because the API contract does
  not provide a public prospect request-status endpoint; no endpoint was
  invented in the mobile lane.
- Push notifications are intentionally deferred; in-app notifications remain
  live.
