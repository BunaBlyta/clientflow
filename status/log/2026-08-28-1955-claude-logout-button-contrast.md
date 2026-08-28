# 2026-08-28 — Claude Code — logout button too light in light mode

PM: "logout button on light mode bit too light." The button's only visual definition was `backgroundColor: color.dangerBg` (`#FEE2E2`, a very pale pink) with no border — read as washed-out against the light canvas background.

Added `borderWidth: 1, borderColor: color.dangerBorder` to both `logoutButton` (the standalone resting-state button) and `confirmLogoutButton` (the "Log out" half of the Cancel/Log out pair shown after tapping it once) in `app/(app)/account/index.tsx`. This is the same `dangerBg`/`dangerBorder` pairing already used for status badges elsewhere in the app (see `lib/status.ts`), so it's consistent rather than a one-off. Deliberately scoped the fix to these two specific button styles rather than the shared `dangerBorder`/`dangerBg` tokens in `lib/theme.ts`, since those tokens are also used for invoice status badges and notification icon backgrounds and shouldn't change as a side effect.

## Files touched

- `mobile/app/(app)/account/index.tsx`

## Verification

- `npx tsc --noEmit` from `mobile/` passes.
- Not checked visually on a device this session.
