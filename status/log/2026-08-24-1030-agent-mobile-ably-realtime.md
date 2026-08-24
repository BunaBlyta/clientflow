# Add true mobile realtime notifications

## What changed

- Added the `ably` mobile dependency.
- Added a bearer-authenticated `/api/realtime/token` client helper.
- Subscribed native clients to `clientflow:user:<userId>` with Ably token
  authentication.
- Validated and merged `notification.created` events into the mobile store.
- Kept the in-app banner and refreshed related invoices, projects, and notes
  immediately when an event arrives.
- Removed the 15-second polling loop from the banner flow. App-resume and tab
  focus refreshes remain as recovery paths.

## Security and limits

The Ably private API key remains on the server. The mobile app receives a
short-lived, channel-scoped token from the authenticated API route. This is
true realtime while the app is active; background or closed-app notifications
still require Apple push credentials.

## Verification

- `cd mobile && npx tsc --noEmit`
- `cd mobile && npx expo export --platform web --output-dir /private/tmp/clientflow-mobile-ably-realtime`
- `git diff --check -- mobile`

All passed.
