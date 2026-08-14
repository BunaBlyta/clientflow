# CURRENT — mobile lane (Agent C)

Last updated: 2026-08-14 09:19 by Codex — compact all-tab footer

## Current state

- The Expo client has live login, verification-code onboarding, projects,
  project status tracking, shared notes, invoices, Stripe Checkout, and in-app
  notifications. Push notifications remain deliberately cut from v1.
- Account and Notifications are headerless bottom-tab screens. Their content
  starts below the iPhone status bar using the device's safe-area inset.
- The bottom tab footer is explicitly compact across all three tabs: 64px total
  height, no internal bottom safe-area padding, and no extra item padding.
  Account's scroll clearance matches the 64px footer.
- The app still uses `http://localhost:3000` unless
  `EXPO_PUBLIC_API_URL` is set to a reachable web/API origin.

## Latest change

- Replaced Expo Router's default 49px-plus-inset footer with a deliberate 64px
  total footer so it no longer rises roughly one-third too high on iPhone.
- Removed the extra bottom inset from the footer itself and kept the tab items
  compact.

## Verification

- `cd mobile && npx tsc --noEmit` under Node 22.23.2: passed.
- `cd mobile && npx expo start --web` under Node 22.23.2: launched, but this
  attempt did not bind port 8081 in the sandbox before it was stopped.
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
