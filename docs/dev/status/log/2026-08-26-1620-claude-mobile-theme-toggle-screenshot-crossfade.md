# Mobile theme toggle: screenshot crossfade

- User reported the dark/light toggle's animation (from earlier sessions: dim/undim opacity masking) still lagged and looked wrong no matter how it was tuned — a stutter mid-fade, then a flash of the stale theme, then a "filter over the page" look at a deeper dip.
- Root-caused the original lag: the switch on the Account screen animated its own `backgroundColor` directly, which forces the whole spring onto the JS thread — the same thread the app-wide theme re-render (`~40 files` read `useTheme()`, all 5 tabs stay mounted) was hogging at the same moment, so the switch visibly froze mid-slide. Fixed by converting the switch's track color to two stacked opacity-crossfading layers instead of a color interpolation, making it fully native-driver-safe.
- The subsequent flash/filter/mismatch complaints traced back to the underlying technique: every masking approach (opacity dip, background-only crossfade, per-element color crossfade) either exposed a mid-transition mismatch or never looked like a real transition, because the actual UI content never changed color gradually.
- Rebuilt the transition as a genuine screenshot crossfade (the technique iOS/Twitter-style toggles use): capture the current screen with `react-native-view-shot`, hold it as a frozen overlay, swap the live theme underneath while hidden, fade the overlay away. User approved this direction explicitly after being offered the alternatives (expanding reveal, per-element color melt, keep-it-subtle) and their tradeoffs.
- `react-native-view-shot` needed a real native rebuild (not just JS reload) — walked the user through `pod install` + `expo run:ios`, then `expo run:ios --device` for their physical phone (which also hit an unrelated device-storage error, resolved by freeing space).
- Iterated through several follow-on bugs surfaced by on-device testing: capture format/quality tuned down (png/quality 1 → jpg/quality 0.8) since nothing can appear until capture resolves and full lossless capture felt sluggish; the Account screen's switch got its own Modal-based always-on-top live copy since it was getting captured mid-animation into the frozen screenshot (visible as overlapping sun/moon icons); that Modal copy then lost its animation on remount (RN's `Modal` unmounts children when hidden) until the animated value was lifted out of the component and shared between the persistent in-row switch and the remounting floating copy.
- Along the way, user asked to revert the switch's local-vs-derived-state approach back to its pre-screenshot behavior (eager local state for instant tactile feedback) while keeping the screenshot crossfade itself — did so, then had to re-add the Modal fix once the double-icon bug reappeared as expected.
- Added theme-mode persistence via `expo-secure-store` (mirroring `lib/i18n.ts`'s existing language-persistence pattern) after noticing `mode` had no persistence at all and would reset to light on every reload.
- User confirmed the final result works well on their physical device.

## Verification

- `npx tsc --noEmit`: passed (checked after every edit this session).
- `npx expo export --platform ios`: passed (bundler sanity check, run several times through the session).
- No automated UI/animation tests exist in this project yet — verification was tsc/bundle correctness plus the user's own on-device testing, which they did throughout and confirmed at the end.

## Scope

- Touched only `mobile/lib/theme.ts` and `mobile/app/(app)/account.tsx`, plus `mobile/package.json`/`mobile/package-lock.json` for the new `react-native-view-shot` dependency (installed by Buna, not this session).
- No API contracts, stores, navigation behavior, payment behavior, or authentication behavior changed.
