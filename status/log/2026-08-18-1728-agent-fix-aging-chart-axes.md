### 2026-08-18 17:28 — Codex — fix aging chart axes

Changed:
- Added explicit x and y axis lines and tick marks to the project aging scatter plot.
- Aligned stage labels and horizontal grid lines to the y-axis positions.
- Made the x-axis scale extend to a rounded data-driven maximum with consistent tick spacing.
- Moved the localized axis title to the lower-right beneath the scale.

Tried and abandoned (what didn't work, and why):
- The earlier grid-only treatment looked like axes but left the tick and title positions disconnected from the plot bounds.

Left for next session:
- No verification was run, per the user's instruction.

Assumptions made (flag if wrong):
- A standard Cartesian chart frame is clearer than a minimal grid-only treatment for this scatter plot.

Blockers:
- Live browser inspection was unavailable in this session.
