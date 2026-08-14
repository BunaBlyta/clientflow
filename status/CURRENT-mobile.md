# CURRENT — mobile lane (Agent C)

Last updated: 2026-08-14 09:09 by Codex — compact iPhone tab footer

## Current state

- The Expo client has live login, verification-code onboarding, projects,
  project status tracking, shared notes, invoices, Stripe Checkout, and in-app
  notifications. Push notifications remain deliberately cut from v1.
- Account and Notifications are headerless bottom-tab screens. Their content
  starts below the iPhone status bar using the device's safe-area inset.
- The bottom tab footer now uses 52px of content height plus the device bottom
  inset, with compact internal padding. Account's scroll clearance matches the
  same 52px height, so the footer no longer rises unnecessarily high.
- The app still uses `http://localhost:3000` unless
  `EXPO_PUBLIC_API_URL` is set to a reachable web/API origin.

## Latest change

- Reduced the tab bar content height from 64px to 52px and changed tab item
  padding from 8px to 4px. The iPhone safe-area inset remains intact, so the
  footer stays clear of the home indicator without taking extra screen space.

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
