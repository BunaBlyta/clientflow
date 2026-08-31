### 2026-08-24 13:04 — Codex — remove dark navigation flash

Changed:
- Set the tab scene background and Projects stack content background to the active theme canvas color.
- Dark-mode navigation transitions now render over charcoal instead of the navigator’s default white background.
- Native shift/slide motion and the web-safe no-animation behavior remain unchanged.
- Ran `npx tsc --noEmit` from `mobile/`; it passed.
- Ran `npx expo export --platform web --output-dir /private/tmp/clientflow-mobile-dark-navigation`; it passed.
- Ran `git diff --check` for the mobile change; it passed.

Tried and abandoned (what didn't work, and why):
- None.

Left for next session:
- Nothing specific for this change.

Assumptions made (flag if wrong):
- The remaining white flash was the navigator scene background showing through during a theme-dark transition.

Blockers:
- None.
