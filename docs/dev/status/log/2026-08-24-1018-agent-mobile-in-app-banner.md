# Add native in-app notification banners

## What changed

- Added a native banner/toast component for newly arrived notifications.
- Added a 15-second active-app poll that compares the durable notification
  inbox before and after refresh.
- Tapping a banner marks it read and opens its invoice, project, notes, or the
  Notifications tab when no deeper destination exists.
- The initial inbox load does not produce banners for old notifications.

## Why

Apple push credentials are not available yet. This gives the native client a
useful immediate notification surface while the app is open without requiring
Apple Developer enrollment or Expo push delivery.

## Verification

- `cd mobile && npx tsc --noEmit`
- `cd mobile && npx expo export --platform web --output-dir /private/tmp/clientflow-mobile-in-app-notifications`
- `git diff --check -- mobile`

All passed.
