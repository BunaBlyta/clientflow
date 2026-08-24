### 2026-08-18 08:43 — Codex — landing header control spacing and radii

Changed:
- Flattened the right-side header controls into one flex row so language, theme, and staff login use the same gaps.
- Made landing header links and controls pill-shaped with one shared radius in light and dark mode.
- Equalized the compact language menu’s outer and item padding.

Tried and abandoned (what didn't work, and why):
- No visual browser check or test suite run, per the user’s request to keep this small UI pass fast. `git diff --check` passed.

Left for next session:
- User visual check of the landing header in light and dark mode.

Assumptions made (flag if wrong):
- “All buttons on header” includes the centered navigation links and the staff-login link, since they share the header control treatment.

Blockers:
- None.
