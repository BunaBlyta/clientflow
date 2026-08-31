### 2026-08-18 08:45 — Codex — tighten language menu right padding

Changed:
- Overrode the select item’s default right padding reserved for the checkmark so the compact language menu is even on all sides.

Tried and abandoned (what didn't work, and why):
- The initial uniform padding rule did not fully override the select item’s right-side spacing, so a stronger compact-menu override was added.

Left for next session:
- User visual check of the language dropdown.

Assumptions made (flag if wrong):
- The extra right gap was coming from the select item’s built-in `pr-8` checkmark spacing.

Blockers:
- None.
