# Animated mobile origin back — 2026-08-24 13:35

## What changed

- Kept the working `router.replace(...)` source-tab return in `mobile/components/OriginBackButton.tsx`.
- Added a short native-driver fade and 24px left slide to the detail screen before the route changes, so the origin back action no longer snaps away.
- Updated `Screen` to support animated styles on its safe-area root. This applies only when the origin back action starts; normal project navigation remains unchanged.

## Verification

- `npx tsc --noEmit` passed.
- `npx expo export --platform ios --output-dir /private/tmp/clientflow-mobile-ios-smooth-origin` passed.
