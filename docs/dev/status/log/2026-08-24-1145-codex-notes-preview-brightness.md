### 2026-08-24 11:45 — Codex — brighten dark notes preview bubble

Changed:
- Switched the project-detail studio note preview bubble from the muted surface to the accent-soft surface, making it visibly lighter in dark mode.
- The same surface remains darker than the white card in light mode.
- Ran `npx tsc --noEmit` from `mobile/`; it passed.
- Ran `git diff --check` for the mobile change; it passed.

Tried and abandoned (what didn't work, and why):
- The muted surface was still too close to the dark preview card, so it was replaced with the brighter accent-soft surface.

Left for next session:
- Nothing specific for this change.

Assumptions made (flag if wrong):
- “Lighter in dark” means the note bubble needs more visible separation from the dark preview card.

Blockers:
- None.
