# Keep tab scenes mounted — 2026-08-24 13:48

## What changed

- Added `detachInactiveScreens={false}` to the app Tabs navigator.
- This keeps a selected project’s nested native stack mounted while the user visits another tab, avoiding the detach/reattach frame before the custom focus slide.
- This attempt is intentionally uncommitted per user request.

## Verification

- `npx tsc --noEmit` passed.
- `npx expo export --platform ios --output-dir /private/tmp/clientflow-mobile-ios-tabs-kept-mounted` passed.
