# 2026-08-28 — Claude Code — pill tab bar: fix icon centering, lower the pill

Follow-up to `2026-08-28-1745-claude-pill-tab-bar.md`. PM feedback: icons weren't centered correctly inside the new pill, and the pill should sit a bit lower (closer to the bottom edge).

## Centering

`@react-navigation/bottom-tabs`' default tab item reserves margin around the icon sized to leave room for a label underneath. Setting `tabBarShowLabel: false` removes the label but doesn't zero that margin out, so the icon was sitting off-center within the pill instead of dead-center. Fixed with `tabBarIconStyle: { margin: 0 }`, plus explicit `alignItems: 'center'` / `justifyContent: 'center'` on `tabBarItemStyle` (previously only `height`/padding were set there).

## Lower pill

`marginBottom` was the full `insets.bottom` (the home-indicator safe-area clearance), which is more clearance than the pill actually needs — it only has to clear the gesture area, not reproduce the full inset. Reduced to `insets.bottom - spacing.sm`, floored at `spacing.xs` so it never goes negative or touches the edge on a device with `insets.bottom` at or near 0.

## Files touched

- `mobile/app/(app)/_layout.tsx`

## Verification

- `npx tsc --noEmit` from `mobile/` passes (confirms `tabBarIconStyle` is a valid option on the installed `@react-navigation/bottom-tabs` types).
- Not checked on a device this session.
