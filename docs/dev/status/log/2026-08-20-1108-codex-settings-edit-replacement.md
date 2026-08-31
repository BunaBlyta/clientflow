### 2026-08-20 11:08 — Codex — Settings package edit replacement

Changed:
- Package edit mode now replaces the package list and tabs inside the fixed-height Settings modal.
- The edit form stays within the existing modal instead of expanding it or adding nested list scrolling.
- Cancel returns to the normal Packages view.

Tried and abandoned (what didn't work, and why):
- Expanding the modal for edit mode was not the requested interaction; the form should replace the other Settings content instead.

Left for next session:
- No commit created; the user asked to handle commits separately.

Assumptions made (flag if wrong):
- Hiding the tab switcher while editing is appropriate because Cancel is the route back to the Packages list.

Blockers:
- None.
