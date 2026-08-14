# CURRENT — mobile lane (Agent C)

Last updated: 2026-08-14 09:23 by Codex — raise tab icons only

## Current state

- The Expo client has live login, verification-code onboarding, projects,
  project status tracking, shared notes, invoices, Stripe Checkout, and in-app
  notifications. Push notifications remain deliberately cut from v1.
- Account and Notifications are headerless bottom-tab screens. Their content
  starts below the iPhone status bar using the device's safe-area inset.
- The bottom tab footer is 64px total across Projects, Notifications, and
  Account. The icon-and-label group sits lower within it, and the icons alone
  are now raised 4px so they sit slightly closer to their labels.
- The app still uses `http://localhost:3000` unless
  `EXPO_PUBLIC_API_URL` is set to a reachable web/API origin.

## Latest change

- Added a shared `tabBarIconStyle` transform of -4px on Y. Labels remain at
  their existing position; only the Projects, Notifications, and Account icons
  move upward.

## Verification

- `cd mobile && npx tsc --noEmit` under Node 22.23.2: passed.
- `cd mobile && npx expo start --web` under Node 22.23.2: launched, but the
  process did not bind port 8081 in the sandbox before it was stopped.
- Root `npm run test`: passed — 34 test files, 145 tests.
- Root `npm run typecheck`: passed on rerun after a transient missing `.next`
  generated-types error.
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
