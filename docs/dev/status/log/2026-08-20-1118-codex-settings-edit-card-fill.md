### 2026-08-20 11:18 — Codex — Settings edit card fill

Changed:
- Made the edit-mode Settings body a flex column.
- Let the active tab panel and package edit shell fill the available modal height.
- Kept the normal Packages and Team layouts unchanged.

Tried and abandoned (what didn't work, and why):
- Adjusting only the edit form's bottom padding did not affect the visible modal gap because the outer card was not filling the available body.

Left for next session:
- No commit created; the user asked to handle commits separately.

Assumptions made (flag if wrong):
- The intended result is equal outer spacing around the edit card, with the card extending down rather than adding more space inside the form.

Blockers:
- None.
