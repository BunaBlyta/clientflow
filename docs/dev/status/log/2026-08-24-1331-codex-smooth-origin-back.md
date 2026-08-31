# Smooth mobile origin back transition — 2026-08-24 13:31

## What changed

- Changed the custom back action in `mobile/components/OriginBackButton.tsx` from an instant route replacement to `router.dismissTo(...)`.
- The source-tab return now uses the project stack’s native dismissal animation, so leaving a project or invoice detail screen no longer snaps abruptly.
- Kept the `beforeRemove` listener removed because native-stack does not reliably support that interception path.

## Verification

- `npx tsc --noEmit` passed.
- `npx expo export --platform ios --output-dir /private/tmp/clientflow-mobile-ios-smooth-back` passed.
