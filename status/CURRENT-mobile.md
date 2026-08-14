# CURRENT — mobile lane (Agent C)

Last updated: 2026-08-14 09:06 by Codex — iPhone tab safe-area spacing

## Current state

- The Expo client has live login, verification-code onboarding, projects,
  project status tracking, shared notes, invoices, Stripe Checkout, and in-app
  notifications. Push notifications remain deliberately cut from v1.
- Account and Notifications are headerless bottom-tab screens. Their content
  now starts below the iPhone status bar using the device's safe-area inset;
  nested project screens were left unchanged so stack headers do not gain a
  duplicate top inset.
- The app still uses `http://localhost:3000` unless
  `EXPO_PUBLIC_API_URL` is set to a reachable web/API origin.

## Latest change

- Added the top safe-area inset to the Account and Notifications scroll content.
  This keeps headings, controls, and notification rows clear of the time,
  battery, and Wi‑Fi indicators on iPhone while preserving the existing bottom
  tab clearance and scrolling behavior.

## Verification

- `cd mobile && npx tsc --noEmit`: passed.
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
