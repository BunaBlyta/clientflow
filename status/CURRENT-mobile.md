# CURRENT — mobile lane (Agent C)

Last updated: 2026-08-14 09:33 by Codex — iOS typography, project header, and Account redesign

## Current state

- The Expo client has live login, verification-code onboarding, projects,
  project status tracking, shared notes, invoices, Stripe Checkout, and in-app
  notifications. Push notifications remain deliberately cut from v1.
- Account and Notifications are headerless bottom-tab screens. Their content
  starts below the iPhone status bar using the device's safe-area inset.
- The bottom tab footer is 64px total across Projects, Notifications, and
  Account. Its icon-and-label group is lower in the footer, with icons raised
  4px and labels rendered in Inter on non-iOS platforms.
- On iOS, mobile text now uses the system SF Pro Text faces for a more native,
  premium iPhone presentation; web and non-iOS platforms keep the loaded Inter
  faces.
- The app still uses `http://localhost:3000` unless
  `EXPO_PUBLIC_API_URL` is set to a reachable web/API origin.

## Latest change

- Rebuilt Account as a quieter iOS settings/profile surface with one identity
  header, grouped contact rows, restrained theme/language controls, and a calm
  outlined logout action.
- Removed the duplicate project name from the project-detail body. The native
  stack header is now the single project title; package information remains.
- Kept all route behavior, API calls, payment handling, and settings actions
  unchanged.

## Verification

- `cd mobile && npx tsc --noEmit` under Node 22.23.2: passed.
- `cd mobile && npx expo start --web` under Node 22.23.2: launched, but this
  run did not bind port 8081 in the sandbox before it was stopped.
- Root `npm run test`: passed — 34 test files, 145 tests.
- Root `npm run typecheck`: passed.
- Root `npm run lint`: passed.
- No physical iPhone, simulator, or in-app browser screenshot was available in
  this session.

## Next work / known limits

- The request-status screen still uses fixtures because the API contract does
  not provide a public prospect request-status endpoint; no endpoint was
  invented in the mobile lane.
- Push notifications are intentionally deferred; in-app notifications remain
  live.
