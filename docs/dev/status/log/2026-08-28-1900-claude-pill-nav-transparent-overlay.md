# 2026-08-28 — Claude Code — pill nav: transparent overlay + source-verified shape fix

Long saga, worth reading start to finish if picking this up. Chronological order of what actually happened, since several attempts were wrong and it matters which:

1. PM reported a "grey strip under the pill." Four attempts in a row assumed it was a backdrop-color mismatch and tried recoloring different layers (a wrapper View, `sceneStyle`, the root Stack's `contentStyle`) and reducing the pill's shadow. **None of these were the real bug.** Screenshots eventually showed the true cause: a scrolled list's last card rendering *behind* the pill, its background bleeding out around the edges — a content-clearance problem, not a color problem. Fixed separately by adding `mobile/lib/tab-bar.ts` (`TAB_BAR_CLEARANCE`, the pill's real footprint) and using it in `Screen.tsx`'s scroll padding instead of the old `spacing.xl + insets.bottom` guess.

2. PM then clarified the actual design intent directly: **"behind the pill should be transparent"** — i.e. this should be a genuine floating overlay (real Instagram/WhatsApp pattern) where content scrolls visibly underneath the tab bar's transparent margins, and only the opaque pill shape itself covers anything. This is the opposite of what all four backdrop-color fixes assumed, and different from the margin-based non-overlapping layout the original pill implementation deliberately chose (specifically *to avoid* content-behind-tab-bar situations — which was the wrong call once "transparent" was the actual goal). Switched `tabBarStyle` to `position: 'absolute'` with no backdrop layer at all; the `TAB_BAR_CLEARANCE` padding from step 1 does the real work of keeping scrolled content's last item above the pill instead of hidden under its opaque body.

3. PM reported the pill now looked "stretched." Rather than guess a fifth time, read the actual installed `@react-navigation/bottom-tabs` source (bundled inside `expo-router`, at `node_modules/expo-router/build/react-navigation/bottom-tabs/views/BottomTabBar.js`) to find real causes instead of assuming:
   - The library's own base style (`styles.bottom`) sets `start: 0, end: 0` — RTL-aware logical properties that React Native treats as **distinct** from `left`/`right`, not overridden by setting the latter. My `tabBarStyle` only set `left`/`right`, leaving `start`/`end` at the library's `0` (full width) in the flattened style array, fighting with my intended margins. Now sets all four (`left`, `right`, `start`, `end`) so nothing is ambiguous.
   - The library's internal style-merge object sets `paddingHorizontal: Math.max(insets.left, insets.right)` ahead of my `tabBarStyle` in the array; I never overrode `paddingHorizontal`, so it was free to compress the icon row inward from both edges while the pill's own outer width stayed fixed — squeezed content inside a fixed-size shape reads as "stretched." Added `paddingHorizontal: 0` explicitly.

## Files touched

- `mobile/app/(app)/_layout.tsx`
- `mobile/components/ui/Screen.tsx`
- `mobile/lib/tab-bar.ts` (new)
- `mobile/app/_layout.tsx` (root Stack `contentStyle` from step 1 — harmless, kept as a reasonable fallback even though it wasn't the real bug)

## Verification

- `npx tsc --noEmit` from `mobile/` passes throughout.
- **Not yet confirmed on the PM's device for steps 2-3.** Step 1's `TAB_BAR_CLEARANCE` content-clearance fix is separately confirmed necessary by the screenshot evidence in the conversation, but the transparent-overlay switch and the start/end + paddingHorizontal fixes for "stretched" have not been visually verified yet. Don't treat this saga as closed until they are.
