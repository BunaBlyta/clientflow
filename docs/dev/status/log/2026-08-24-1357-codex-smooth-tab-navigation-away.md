# Smooth tab navigation away from detail — 2026-08-24 13:57

## What changed

- Updated `useOriginBack` to listen for bottom-tab presses from origin-launched project/invoice details.
- The tab action is prevented briefly, the existing 180ms fade/left-slide exit runs, and the original tab action is dispatched after it completes.
- Header back behavior remains unchanged.
- This attempt is intentionally uncommitted per user request.

## Verification

- `npx tsc --noEmit` passed.
- `npx expo export --platform ios --output-dir /private/tmp/clientflow-mobile-ios-smooth-tab-back` passed.
