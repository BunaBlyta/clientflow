# Remove tab transition flash — 2026-08-24 13:41

## What changed

- Removed opacity animation from the shared tab focus transition because the dimmed frame looked like a brief rerender when returning to a preserved project.
- Reduced the transition to an 8px translate-only slide over 160ms, keeping the content continuously visible.

## Verification

- `npx tsc --noEmit` passed.
- `npx expo export --platform ios --output-dir /private/tmp/clientflow-mobile-ios-tabs-no-flash` passed.
