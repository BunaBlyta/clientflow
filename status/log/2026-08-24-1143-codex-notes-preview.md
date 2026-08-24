### 2026-08-24 11:43 — Codex — improve mobile notes preview contrast

Changed:
- Updated the project-detail notes preview bubble for studio-authored notes to use the theme’s muted surface, so it reads darker in light mode and lighter in dark mode.
- Left the full Notes screen and client-authored accent bubbles unchanged.
- Ran `npx tsc --noEmit` from `mobile/`; it passed.
- Ran `git diff --check` for the mobile change; it passed.

Tried and abandoned (what didn't work, and why):
- None.

Left for next session:
- Nothing specific for this change.

Assumptions made (flag if wrong):
- “Notes preview” refers to the compact note bubble on the project detail screen, not the full Notes chat screen.

Blockers:
- None.
