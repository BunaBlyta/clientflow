# CURRENT — mobile lane (Agent C)

Last updated: 2026-08-17 15:09 by Codex — iOS push notification delivery

## Current state

- The Expo app is configured for iOS push notifications with bundle identifier
  `com.tetbit.clientflow`, the existing EAS project ID, and the
  `expo-notifications` config plugin. The user-installed Expo packages and
  `eas.json` are included in the mobile lane commit.
- A native-only notification coordinator requests permission after a session is
  restored, registers Expo tokens at `POST /api/notifications/devices`, handles
  token rotation and best-effort unregister on logout, reconciles foreground and
  tapped notifications through authoritative API reads, and catches up on app
  resume. Web builds do nothing in this layer.
- Taps accept only validated notification IDs and known event types. Notes open
  the project notes screen; invoice and project events open their detail route.
  Notification payloads never provide client state or arbitrary URLs.
- Checkout reacts to webhook-backed invoice updates while open, so a live PAID
  or FAILED invoice moves the UI to the matching state.
- Zustand data is cleared on logout/account switch, production builds no longer
  start with fixtures, and per-resource request generations prevent stale API
  responses from overwriting newer data.

## Verification

- `cd mobile && npx tsc --noEmit`: passed.
- `cd mobile && npx expo config --type public --json`: passed; bundle identifier,
  notification plugin, and EAS project ID are present.
- `cd mobile && npx expo export --platform web --output-dir /private/tmp/clientflow-mobile-push-check`:
  passed.
- `git diff --check -- mobile`: pending final staged check.
- No physical iPhone or iOS development build was available for a real APNs
  delivery test. Mobile has no test runner installed, so pure helper tests were
  not added without introducing an install.

## API seam for next session

- Mobile sends `{ token, platform: "IOS", appVersion? }` to
  `POST /api/notifications/devices` and `{ token }` to the same endpoint with
  `DELETE`, authenticated with the normal bearer token.
- Push data is expected to contain only `notificationId`, `type`, and optional
  `projectId`, `invoiceId`, and `requestId`. The mobile coordinator refetches
  notifications and affected entities after delivery.

## Known limits

- APNs credentials and a physical iPhone/development build are still required
  for end-to-end push proof. Expo Go is not sufficient for remote push.
- The app still uses existing fixture-backed request-status UI where the API has
  no public prospect status endpoint.
