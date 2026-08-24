### 2026-08-24 11:59 — Codex — fix web navigation animation regression

Changed:
- Disabled tab and project-stack navigator animations on web, where the new shift/slide transitions caused a blank Notifications scene and a white frame during tab changes.
- Kept the 180ms tab shift and horizontal project slide for native iOS/Android.
- Ran `npx tsc --noEmit` from `mobile/`; it passed.
- Ran `npx expo export --platform web --output-dir /private/tmp/clientflow-mobile-navigation-web-safe`; it passed.
- Ran `git diff --check` for the mobile change; it passed.

Tried and abandoned (what didn't work, and why):
- The same navigator animations on web caused the reported rendering regression, so web now uses the stable no-animation path.

Left for next session:
- Nothing specific for this change.

Assumptions made (flag if wrong):
- The blank Notifications screen and white transition were caused by the newly enabled web navigator animations, not by the notification data request itself.

Blockers:
- None.
