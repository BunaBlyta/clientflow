### 2026-08-18 17:02 — Codex — polish analytics scatter and heatmap

Changed:
- Added an explicit age legend to the project scatter plot.
- Added day numbers and a today outline to the receivables heatmap.
- Added an overdue legend and preserved the amount-intensity legend.
- Fixed calendar cell generation to use local date keys so dates do not shift across timezones.

Tried and abandoned (what didn't work, and why):
- The first scatter/heatmap pass left too much meaning hidden in hover titles and color alone.

Left for next session:
- Live browser inspection was unavailable because the browser service was not connected; no verification was run, per the user's instruction.

Assumptions made (flag if wrong):
- Keeping the 35-day runway but making each cell legible is preferable to switching back to bucket bars.

Blockers:
- In-app browser service unavailable in this session.
