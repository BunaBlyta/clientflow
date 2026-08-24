### 2026-08-20 10:42 — Codex — Settings modal height

Changed:
- Restored the account dropdown Settings row to its previous spacing.
- Reduced the fixed Settings modal height from 600px to 584px so the bottom gap is smaller.

Tried and abandoned (what didn't work, and why):
- The account dropdown row was adjusted first, but that was the wrong surface; it was restored after the user clarified they meant the modal.

Left for next session:
- No commit created; the user asked to handle commits separately.

Assumptions made (flag if wrong):
- The unwanted bottom gap came from the fixed modal height rather than internal Settings content padding.

Blockers:
- None.
