# Mobile safe-area and invoice notification investigation

## What changed

- Updated the shared mobile `Screen` wrapper to use `SafeAreaView` for the top
  safe area on native devices.
- Removed duplicate top-inset calculations from the Notifications and Account
  tabs.

## Why

The tab titles and supporting text could sit too close to, or under, the iPhone
notch because the top inset was calculated separately by individual screens.
The shared wrapper now owns that spacing.

## Notification finding

Invoice-issued notifications are addressed to the client linked to the invoice.
They do not appear in a staff user's mobile inbox. The client app must be
logged in as the invoice's client to see the notification after refreshing.

## Verification

- `cd mobile && npx tsc --noEmit`
- `cd mobile && npx expo export --platform web --output-dir /private/tmp/clientflow-mobile-notifications-safe-area`
- `git diff --check -- mobile`

All passed.
