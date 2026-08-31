### 2026-08-31 11:34 — Codex — chat composer shadow

Changed:
- Added the floating nav pill's soft shadow treatment to the chat input capsule and round send button.
- Kept the row itself transparent, so the controls gain depth without reintroducing a large composer container box.

Tried and abandoned (what didn't work, and why):
- No discarded implementation in this pass.

Left for next session:
- Nothing for this task.

Assumptions made (flag if wrong):
- Both visible compose controls should share the elevation treatment so the input and send button read as one floating control group.

Blockers:
- Mobile typecheck passes. Root `npm run verify` remains blocked by the existing web-lane lint errors recorded in the mobile state file.
