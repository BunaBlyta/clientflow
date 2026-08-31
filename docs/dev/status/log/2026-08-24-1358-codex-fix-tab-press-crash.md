# Fix tab press action crash — 2026-08-24 13:58

## What changed

- Fixed `OriginBackButton`’s bottom-tab listener after Expo reported `Cannot read property 'action' of undefined`.
- Tab presses now resolve the selected tab from the event target and navigate by route name after the exit animation.
- This attempt is intentionally uncommitted per user request.

## Verification

- `npx tsc --noEmit` passed.
- `npx expo export --platform web --output-dir /private/tmp/clientflow-mobile-web-tab-press-fix` passed.
