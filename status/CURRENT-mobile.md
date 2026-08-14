# CURRENT — mobile lane (Agent C)

Last updated: 2026-08-14 10:10 by Codex — native iOS auth navigation and platform polish

## Current state

- The Expo client has live login, verification-code onboarding, projects,
  project status tracking, shared notes, invoices, Stripe Checkout, and in-app
  notifications. Push notifications remain deliberately cut from v1.
- Account and Notifications are headerless bottom-tab screens. Their content
  starts below the iPhone status bar using the device's safe-area inset.
- The bottom tab footer is 64px total across Projects, Notifications, and
  Account. Its icon-and-label group is lower in the footer, with icons raised
  4px and labels rendered in Inter on non-iOS platforms.
- On iOS, mobile text uses the system SF Pro Text faces for a more native,
  premium iPhone presentation; web and non-iOS platforms keep the loaded Inter
  faces.
- The app still uses `http://localhost:3000` unless
  `EXPO_PUBLIC_API_URL` is set to a reachable web/API origin.

## Latest change

- Replaced the custom auth back buttons with native Expo Router stack headers
  on verification, password, forgot-password, and request-status screens. The
  screens now receive the iOS chevron, native push/pop transition, and edge
  swipe-back behavior used by the project stack.
- Added safe-area-aware spacing to the auth screens and kept login headerless
  with its own safe-area padding.
- Replaced the login screen's Material-style OR divider and full-width invite
  button with a restrained inline invite link.
- Changed the remaining one-pixel mobile borders to native hairlines and
  removed unused Android elevation props from shared mobile surfaces.

## Verification

- `cd mobile && npx tsc --noEmit` under Node 22.23.2: passed.
- `cd mobile && npx expo start --web` under Node 22.23.2: the existing local
  Expo web instance responded with HTTP 200 on port 8081.
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
