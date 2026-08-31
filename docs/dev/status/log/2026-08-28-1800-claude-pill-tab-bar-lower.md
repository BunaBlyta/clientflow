# 2026-08-28 — Claude Code — pill tab bar: push lower without shrinking

Follow-up to `2026-08-28-1755-claude-pill-tab-bar-centering.md`. PM: "can it not go lower? like not make it smaller just move it down" — the previous pass only trimmed the pill's `marginBottom` down from the full `insets.bottom` inset by a fixed subtraction (`insets.bottom - spacing.sm`), which still scales with the device's home-indicator inset and wasn't enough movement.

Changed `marginBottom` to a flat `spacing.xs` (4px) regardless of `insets.bottom` — height/size (`TAB_BAR_HEIGHT`, all padding) is untouched, only its vertical position moved down. Removed the now-unused `useSafeAreaInsets` import and `insets` variable since nothing in the file reads it anymore.

## Files touched

- `mobile/app/(app)/_layout.tsx`

## Verification

- `npx tsc --noEmit` from `mobile/` passes.
- Not checked on a device — worth confirming this doesn't sit uncomfortably close to the home-indicator gesture area on notched iPhones, since it no longer scales with that inset at all.
