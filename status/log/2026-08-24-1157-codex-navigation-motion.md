### 2026-08-24 11:57 — Codex — smooth mobile tab and back transitions

Changed:
- Added the Expo Router v57 `shift` animation to tab switching with a short 180ms timing transition.
- Set the Projects stack to use a horizontal slide transition.
- Changed origin-aware back navigation from a hard replace to `dismissTo`, allowing the stack to close with its native motion before returning to the source tab.
- Ran `npx tsc --noEmit` from `mobile/`; it passed.
- Ran `npx expo export --platform web --output-dir /private/tmp/clientflow-mobile-navigation-motion`; it passed.
- Ran `git diff --check` for the mobile change; it passed.

Tried and abandoned (what didn't work, and why):
- The hard `replace` return path was visually abrupt, so it was replaced with `dismissTo` to preserve the source-tab behavior while allowing a closing transition.

Left for next session:
- Nothing specific for this change.

Assumptions made (flag if wrong):
- A restrained 180ms shift is the intended “little sliding animation” for tab changes.

Blockers:
- None.
