### 2026-08-20 11:34 — Codex — inline Create package layout

Changed:
- Made the inline Create package form use the remaining replacement-view height so its Cancel/Create footer remains visible.
- Made the replacement shell opaque and clipped so the previous Settings view cannot show through.

Tried and abandoned (what didn't work, and why):
- The first inline form kept its natural height, which pushed the footer out of the fixed replacement area.

Left for next session:
- No commit created; the user asked to handle commits separately.

Assumptions made (flag if wrong):
- The previous content showing through was caused by the replacement shell’s transparent surface.

Blockers:
- None.
