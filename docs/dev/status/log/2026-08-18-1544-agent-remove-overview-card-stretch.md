### 2026-08-18 15:44 — Codex — remove overview card stretch

Changed:
- Removed the forced viewport-height stretch from the Recent Projects and Notifications cards.
- Kept their fixed shared row rhythm and scrollbar-free overflow behavior.
- The card bottoms now follow the visible content instead of leaving an empty area inside each card.

Tried and abandoned (what didn't work, and why):
- Stretching the cards while keeping fixed row heights created a visible blank gap below the rows.

Left for next session:
- No verification was run, per the user's instruction.

Assumptions made (flag if wrong):
- Avoiding an empty gap inside the cards is more important than forcing these two panels to fill the entire viewport.

Blockers:
- None.
