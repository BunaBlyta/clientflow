### 2026-08-18 15:58 — Codex — render full overview lists

Changed:
- Removed the viewport-height row visibility limits from Recent Projects and Notifications.
- Rendered all available projects and notifications in their natural fixed-height rows.
- Kept the panels scrollbar-free and allowed their cards to grow with the real content.

Tried and abandoned (what didn't work, and why):
- Hiding rows by viewport height left empty space when the cards were no longer stretched.

Left for next session:
- No verification was run, per the user's instruction.

Assumptions made (flag if wrong):
- Showing all available rows is the intended way to use real content to reduce the Overview gaps now that the cards no longer have forced heights.

Blockers:
- None.
