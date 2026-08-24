# Single project tab transition — 2026-08-24 13:45

## What changed

- Disabled the native `slide_from_right` animation in the Projects stack.
- The shared 8px, 160ms focus transition is now the only animation when a preserved project screen regains focus, removing the visible harsh-then-smooth double transition.
- Project detail, Notes, and invoice screens remain animated through their existing focus-enabled `Screen` wrappers.

## Verification

- `npx tsc --noEmit` passed.
- `npx expo export --platform ios --output-dir /private/tmp/clientflow-mobile-ios-single-tab-transition` passed.
