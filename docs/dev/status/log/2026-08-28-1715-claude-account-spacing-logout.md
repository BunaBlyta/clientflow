# 2026-08-28 — Claude Code — tighten Account group spacing for logout confirm visibility

PM/user reported the "Confirm log out?" caption wasn't fully visible after tapping Log out — tapping it swaps the single logout button for a taller block (Cancel/Log out buttons plus that caption beneath), and on top of the page's existing Profile/Settings sections that extra height could push the caption below the fold without scrolling.

Asked specifically to tighten the spacing "where profile settings labels are a bit" — the two section headers ("PROFILE", "SETTINGS") had a 16px gap down to their row group (`preferenceLabel.marginBottom: spacing.lg`) and 12px between the groups themselves (`preferenceGroup.marginBottom: spacing.md`). Tightened both to 8px (`spacing.sm`), reclaiming ~24px of vertical space across the two groups combined. Row heights and tap targets (56px rows) are untouched — this is purely the label-to-content and group-to-group whitespace.

## Files touched

- `mobile/app/(app)/account/index.tsx`

## Verification

- `npx tsc --noEmit` from `mobile/` passes.
- Not measured on an actual device against a specific screen height — the fix reclaims real vertical space but whether it's *enough* to guarantee the caption is always on-screen without scrolling depends on device size and font scale; worth a look on the smallest supported device.
