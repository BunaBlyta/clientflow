### 2026-08-18 15:00 — Codex — preserve settings list appearance

Changed:
- Raised both Settings list scroll thresholds from 288px to 400px.
- Preserved the current visible list layout while still preventing future additions from resizing the fixed modal indefinitely.

Tried and abandoned (what didn't work, and why):
- A 288px cap compressed the current list content and created an unwanted gap beneath it.

Left for next session:
- No verification was run, per the user's instruction.

Assumptions made (flag if wrong):
- Existing list content fits within 400px and should remain visually unchanged.

Blockers:
- None.
