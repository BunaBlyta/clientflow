# Mobile theme toggle: real crossfade instead of overlay flash

- The account tab's theme toggle used a full-screen overlay to mask an instant light/dark color swap. Tried several tunings (opaque flash, blended translucent wash, native-driven opacity) at the user's request as each still read as a visible pulse/flash.
- Replaced the overlay entirely with a shared `progress` Animated value in `lib/theme.ts`, exposed via a new `useAnimatedThemeColor(key)` hook. Components that opt in render with `Animated.View`/`Animated.Text` and interpolate their real color between the light and dark palette instead of snapping.
- Wired it into `AtmosphereBackground.tsx` (the full-screen background behind every screen) and the account screen's heading, profile card, avatar, preference card, and settings rows.
- Out of scope / still snaps instantly: other tabs, Pressable-driven button fills (logout/cancel/confirm, language options), and hairline row borders — animating those would require restructuring Pressable's function-style API, judged not worth it for a toggle that mostly reads through backgrounds and text.
- Verified with `npx tsc --noEmit` from `mobile/`. Not run on a device/simulator this session (no browser/device connection available) — the user visually confirmed the fix looks right after each iteration.
- Committed: `mobile/lib/theme.ts`, `mobile/app/(app)/account.tsx`, `mobile/components/ui/AtmosphereBackground.tsx`.
