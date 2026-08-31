# 2026-08-28 — Claude Code — floating pill tab bar, icon-only

PM asked to drop the text labels under the bottom tab icons and restyle the bar as a "long pill like on Instagram/WhatsApp."

## Changes

`mobile/app/(app)/_layout.tsx`:

- `tabBarShowLabel: false` — icon-only tabs. Removed the now-unused `tabBarLabelStyle` and the `fontFamily` import it needed.
- `tabBarStyle`: was a full-width bar with a top hairline border and height baked around `insets.bottom`. Now `marginHorizontal`/`marginBottom` (`TAB_BAR_SIDE_MARGIN` = `spacing.lg`) plus `borderRadius: radius.pill`, no top border, and a shadow (`shadowOpacity`/`shadowRadius`/`elevation`) so it reads as floating above the content instead of docked to the edge.
- Deliberately did **not** use `position: 'absolute'` for the floating look, even though that's the more common way to achieve it. With margin instead, the tab bar still reserves its own space in the normal layout flow below the scenes — the last row of a scrolling screen can never end up hidden underneath the pill. `position: 'absolute'` would need every screen's bottom content padding recalculated to clear the pill's height + margins, which isn't safely verifiable without a device this session. Worth revisiting only if the margin approach turns out to look wrong in a way that specifically needs full-bleed floating (e.g. content visible sliding under the pill on scroll).
- `TAB_BAR_HEIGHT` dropped from 68 to 60 now that there's no label row to accommodate.

## Files touched

- `mobile/app/(app)/_layout.tsx`

## Verification

- `npx tsc --noEmit` from `mobile/` passes.
- Not run on a device this session — the pill's exact margins/shadow/height and how the badge on the notifications icon sits without a label are all worth a real look once a device/simulator is available.
