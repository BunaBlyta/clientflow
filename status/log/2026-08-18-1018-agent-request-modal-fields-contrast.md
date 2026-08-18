### 2026-08-18 10:18 — Codex — make light-mode request fields visibly distinct

Changed:
- Increased the light-mode request field contrast to `#e7f1f4` so the change is visible against the modal surface.
- Removed all field borders, outlines, and focus shadows in light mode.

Tried and abandoned (what didn't work, and why):
- The previous blue-gray fill and inset shadow were too subtle to look changed in the rendered modal.

Left for next session:
- Nothing specific.

Assumptions made (flag if wrong):
- The fields should be visibly separated by fill color only, without any border treatment.

Blockers:
- None.
