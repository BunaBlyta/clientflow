### 2026-08-18 18:16 — Codex — keep receivables heatmap cells square

Changed:
- Reworked the receivables heatmap into weekday rows and week columns.
- Kept each day cell at a fixed square 28px size.
- Added a ResizeObserver so wider cards reveal more week columns instead of stretching cells.
- Expanded the source runway to 20 weeks so wider cards have additional dates to display.

Tried and abandoned (what didn't work, and why):
- A fixed five-row grid stretched square cells into wide rectangles on large cards.

Left for next session:
- No verification was run, per the user's instruction.

Assumptions made (flag if wrong):
- A standard weekday-row/week-column calendar heatmap is more legible than the previous week-row layout.

Blockers:
- Live browser inspection was unavailable in this session.
