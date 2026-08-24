### 2026-08-18 17:50 — Codex — constrain aging chart scale

Changed:
- Added a centered 680px maximum width to the project aging scatter plot.
- Kept it responsive below that width while preventing oversized visuals on very wide cards.

Tried and abandoned (what didn't work, and why):
- Unbounded width-driven sizing made the chart too large and visually heavy on wide screens.

Left for next session:
- No verification was run, per the user's instruction.

Assumptions made (flag if wrong):
- A controlled max width is a better balance than either a fixed small canvas or fully unbounded scaling.

Blockers:
- Live browser inspection was unavailable in this session.
