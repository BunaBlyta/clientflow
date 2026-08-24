### 2026-08-20 11:06 — Codex — Settings package edit layout

Changed:
- When a package enters edit mode, the Settings modal expands to its content height.
- Removed the nested list and modal-body scrollbars in that edit state so the whole form renders in the modal.
- Kept the compact fixed-height layout for normal Packages and Team views.

Tried and abandoned (what didn't work, and why):
- None.

Left for next session:
- No commit created; the user asked to handle commits separately.

Assumptions made (flag if wrong):
- The edit form is the only Settings state that should expand beyond the compact normal height.

Blockers:
- None.
