# CURRENT — mobile lane (Agent C)

Last updated: 2026-08-14 09:21 by Codex — lower tab icon and label group

## Current state

- The Expo client has live login, verification-code onboarding, projects,
  project status tracking, shared notes, invoices, Stripe Checkout, and in-app
  notifications. Push notifications remain deliberately cut from v1.
- Account and Notifications are headerless bottom-tab screens. Their content
  starts below the iPhone status bar using the device's safe-area inset.
- The bottom tab footer is 64px total across Projects, Notifications, and
  Account. The icon-and-label group is now shifted 8px lower inside that same
  footer; the footer height itself is unchanged.
- The app still uses `http://localhost:3000` unless
  `EXPO_PUBLIC_API_URL` is set to a reachable web/API origin.

## Latest change

- Changed the shared `tabBarItemStyle` to use 8px top padding and no bottom
  padding, moving all three tab icon/label groups lower without stretching the
  footer.

## Verification

- `cd mobile && npx tsc --noEmit` under Node 22.23.2: passed.
- `cd mobile && npx expo start --web` under Node 22.23.2: launched, but the
  process did not bind port 8081 in the sandbox before it was stopped.
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
