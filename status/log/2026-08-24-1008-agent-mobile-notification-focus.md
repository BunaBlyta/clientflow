# Refresh mobile notifications on tab focus

## What changed

The native Notifications tab now refetches its durable notification list every
time the tab becomes active, rather than only when the screen first mounts.

## Why

The client app can remain open while staff sends an invoice. Returning to the
Notifications tab should then show the newly created invoice notification
without requiring a full native-app restart.

## Verification

- `cd mobile && npx tsc --noEmit`
- `cd mobile && npx expo export --platform web --output-dir /private/tmp/clientflow-mobile-notification-focus`
- `git diff --check -- mobile`

All passed.
