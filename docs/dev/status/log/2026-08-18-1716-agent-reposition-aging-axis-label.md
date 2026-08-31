### 2026-08-18 17:16 — Codex — reposition aging axis label

Changed:
- Restored “Days since last update” to the scatter plot.
- Added bottom axis space and moved the label below the numeric tick labels.

Tried and abandoned (what didn't work, and why):
- Removing the label solved the collision by removing useful context rather than improving its placement.

Left for next session:
- No verification was run, per the user's instruction.

Assumptions made (flag if wrong):
- The label should sit beneath the `0d`, `7d`, `14d`, and `30d` tick labels while remaining inside the chart area.

Blockers:
- Live browser inspection was unavailable in this session.
