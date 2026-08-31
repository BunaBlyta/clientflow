### 2026-08-18 18:08 — Codex — make aging axes card-responsive

Changed:
- Removed the scatter plot’s max-width constraint so it uses the full card width.
- Kept the axis margins tight to the plot boundaries.
- Preserved the ResizeObserver-based day-domain expansion for wider cards.

Tried and abandoned (what didn't work, and why):
- A centered max-width kept the plot visually detached from the Analytics card on wide screens.

Left for next session:
- No verification was run, per the user's instruction.

Assumptions made (flag if wrong):
- The card width, rather than a fixed desktop maximum, should control the scatter plot footprint.

Blockers:
- Live browser inspection was unavailable in this session.
