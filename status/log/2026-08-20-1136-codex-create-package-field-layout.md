### 2026-08-20 11:36 — Codex — Create package field layout

Changed:
- Put Name and Slug on the same row.
- Put Price, Currency, and Estimated duration on the same row.
- Replaced the currency text field with a USD/EUR/GBP dropdown.
- Removed forced vertical distribution so the Cancel/Create buttons stay in view.

Tried and abandoned (what didn't work, and why):
- The stretched form layout left the action row below the visible area.

Left for next session:
- No commit created; the user asked to handle commits separately.

Assumptions made (flag if wrong):
- USD, EUR, and GBP are the useful currency choices for package creation.

Blockers:
- None.
