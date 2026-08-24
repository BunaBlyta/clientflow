### 2026-08-18 17:45 — Codex — make aging chart width-responsive

Changed:
- Removed the fixed-height flex canvas from the project aging scatter plot.
- Let the SVG preserve its chart ratio while sizing to the full card width.
- Kept the legend above the chart.

Tried and abandoned (what didn't work, and why):
- A fixed 288px canvas made the scatter plot look small and leave unused space inside wide cards.

Left for next session:
- No verification was run, per the user's instruction.

Assumptions made (flag if wrong):
- Width-driven proportional sizing is the right behavior for the scatter chart on large screens.

Blockers:
- Live browser inspection was unavailable in this session.
