### 2026-08-18 14:30 — Codex — normalize KPI hint height

Changed:
- Gave every KPI hint a consistent two-line, 32px area.
- Added matching line height and two-line clamping for longer descriptions.

Tried and abandoned (what didn't work, and why):
- Letting each hint size naturally made short and long descriptions produce uneven tile heights.

Left for next session:
- No verification was run, per the user's instruction.

Assumptions made (flag if wrong):
- Matching the hint area is preferable to rewriting the existing translated descriptions.

Blockers:
- None.
