### 2026-08-18 15:02 — Codex — equalize settings list viewports

Changed:
- Set both Packages and Team list containers to an exact 360px height.
- Kept both list areas independently scrollable for future entries.
- Kept the Settings modal fixed at 600px.

Tried and abandoned (what didn't work, and why):
- Matching only the max height still allowed the visible list/table area to differ between tabs.

Left for next session:
- No verification was run, per the user's instruction.

Assumptions made (flag if wrong):
- The visible bordered list/table viewport is the part that must be pixel-identical between tabs.

Blockers:
- None.
