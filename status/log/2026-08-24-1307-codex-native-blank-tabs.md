### 2026-08-24 13:07 — Codex — fix intermittent native blank tabs

Changed:
- Removed the bottom-tab `shift` animation and its transition timing configuration, which could leave Notifications blank on the native app.
- Kept the theme-aware tab scene background and the project-stack slide transition.
- Ran `npx tsc --noEmit` from `mobile/`; it passed.
- Ran `npx expo export --platform ios --output-dir /private/tmp/clientflow-mobile-ios-navigation-safe`; it passed.
- Ran `git diff --check` for the mobile change; it passed.

Tried and abandoned (what didn't work, and why):
- Native bottom-tab shifting was retained through the previous web-safe pass, but the user confirmed it still intermittently caused a persistent blank tab; it has been removed for stability.

Left for next session:
- Nothing specific for this change.

Assumptions made (flag if wrong):
- The persistent blank Notifications screen is caused by the tab scene animation rather than the notification loader.

Blockers:
- No simulator/device is available in this environment for direct native click-through.
