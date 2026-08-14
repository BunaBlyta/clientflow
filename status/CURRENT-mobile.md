# CURRENT — mobile lane (Agent C)

Last updated: 2026-08-14 09:27 by Codex — premium iOS visual pass

## Current state

- The Expo client has live login, verification-code onboarding, projects,
  project status tracking, shared notes, invoices, Stripe Checkout, and in-app
  notifications. Push notifications remain deliberately cut from v1.
- Account and Notifications are headerless bottom-tab screens. Their content
  starts below the iPhone status bar using the device's safe-area inset.
- The bottom tab footer is 64px total across Projects, Notifications, and
  Account. Its icon-and-label group is lower in the footer, with icons raised
  4px and labels rendered in Inter.
- The mobile visual system now uses cooler iOS-style white surfaces, hairline
  borders, softer 10–14px radii, restrained shadows, filled inputs, quieter
  secondary buttons, and circular notification icons. The accent remains the
  website/dashboard `#5AB2FF` blue.
- The app still uses `http://localhost:3000` unless
  `EXPO_PUBLIC_API_URL` is set to a reachable web/API origin.

## Latest change

- Refined the shared theme, Button, TextField, ProjectCard, NotificationRow,
  ProjectStageTracker, tab bar, and Inter tab-label styling to remove the
  generic outlined-card / elevated-control feel and give the client app a more
  premium, restrained iOS presentation.
- Behavior, navigation, API calls, payment handling, and status semantics were
  unchanged.

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
