# 2026-08-28 — Claude Code — found the real source of the grey strip under the pill nav

Two earlier fixes for "grey strip under the pill" (recoloring the `(app)/_layout.tsx` wrapper View, then its `sceneStyle`) had zero visible effect after the PM reloaded the device twice. Both targeted layers *inside* the tabs group's own subtree — the actual gap was one level higher.

## Root cause

`app/_layout.tsx`'s root `Stack` (the one above the `(app)`/`(auth)` groups) never set a `contentStyle`, so React Navigation falls back to its own default theme background — roughly `#F2F2F2`, a light grey. That's always been there, but it was invisible while every screen's own content and the old full-bleed tab bar fully covered it edge to edge. The new pill's `marginHorizontal`/`marginBottom` (see `app/(app)/_layout.tsx`) opened up a real gap around it for the first time, and that gap shows straight through every inner layer down to this root-level default — which is why recoloring the inner wrapper/sceneStyle didn't touch it at all; neither of those layers was ever what was rendering there.

## Fix

`RootNavigator` in `app/_layout.tsx` now reads `color` via `useTheme()` and sets `contentStyle: { backgroundColor: color.navBackground }` on the root `Stack`'s `screenOptions`. This is a backdrop layer only ever visible in a gap like this one — it doesn't touch how any actual screen renders, since `Screen.tsx`'s own content already opaquely covers everything a user normally sees.

## Files touched

- `mobile/app/_layout.tsx`

## Verification

- `npx tsc --noEmit` from `mobile/` passes.
- Not yet confirmed against the PM's own device — this is a different, deeper layer than the two prior (ineffective) attempts, so it needs a fresh device check before treating this as closed.
