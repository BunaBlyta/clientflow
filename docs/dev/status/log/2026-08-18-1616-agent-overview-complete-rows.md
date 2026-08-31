### 2026-08-18 16:16 — Codex — keep overview rows complete

Changed:
- Replaced max-height clipping with a shared row count calculated from the viewport height.
- Recalculate the row count on window resize.
- Render only complete 56px rows plus their 8px gap in both panels.

Tried and abandoned (what didn't work, and why):
- A viewport max-height could end partway through the final row because the height was not aligned to the row-plus-gap rhythm.

Left for next session:
- No verification was run, per the user's instruction.

Assumptions made (flag if wrong):
- A 568px reserved space estimate leaves enough room for the KPI, Average Turnaround, headers, and section gaps above these lists.

Blockers:
- None.
