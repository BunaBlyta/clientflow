# Mobile: theme toggle — cut crossfade scope, then removed card animation

Two more rounds on the account tab's theme toggle, both without device verification (no simulator/device connection this session — iterating purely on the user's live descriptions).

## Round: cut 19 concurrent color interpolations to 5

- User said the earlier "defer the snap" timing fix made no visible difference, and specified the toggle "fades, but choppy/stuttery" when asked. That description points at dropped frames, not a sequencing bug.
- Found `app/(app)/account.tsx` had 19 separate `useAnimatedThemeColor()` calls active concurrently on every toggle: 7 directly in `AccountScreen`, 3 in `PreferenceGroup`, 3 more per `SettingsRow` instance across 3 rows. Color interpolation can't use React Native's native animation driver, so each of these is a JS-thread bridge update to its consuming native view on every animation frame — 19 of those firing at once for 260ms is plausible cause for visible stutter on a real device.
- Cut to 5: the shared `AtmosphereBackground` (unchanged) plus the profile card and preference card's `backgroundColor`/`borderColor`. Reverted everything else (heading, avatar, name/email/company, footer, preference label, all three settings rows' icon background/label/value) to plain static `color.xxx`, relying on the earlier deferred-snap fix to land them in sync when the fade completes.

## Round: stop animating cards independently of their own text

- User's next report: "better, but it kinda changes colors of the app before settling on the mode, it increases contrast." Read as: right as the two animated cards finished arriving at their new background/border tone, their own (still-static, deferred-snap) label text flipped all at once — a visible contrast jump timed exactly to the "settle" moment, since the card's surface had already visually completed its transition while its text hadn't.
- Fix: reverted `profileHeader` and `preferenceOptions` (the two cards) to fully static color again. Removed the `useAnimatedThemeColor` import from `account.tsx` entirely — nothing in that file animates anymore.
- Only `components/ui/AtmosphereBackground.tsx` (the shared full-screen canvas behind every screen) still crossfades. It has no directly-adjacent static foreground content of its own to visibly mismatch against, so it shouldn't produce the same "card vs. its text" artifact. The rest of the UI now changes as one synchronized snap when the background fade completes.

## Status

- `npx tsc --noEmit` passed after both rounds, run from `mobile/`.
- Not verified on a device either round — purely reasoned from the user's descriptions and the animation architecture. This is now five total iterations on this feature across the session (overlay flash → various overlay tunings → real per-element crossfade → deferred snap → scope cut → this). Recommend the user check on-device before further changes; further blind iteration has diminishing value.
- Two commits: `mobile/app/(app)/account.tsx` (scope cut), `mobile/app/(app)/account.tsx` (card animation removal).
