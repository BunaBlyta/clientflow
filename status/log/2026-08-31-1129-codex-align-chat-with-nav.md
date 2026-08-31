### 2026-08-31 11:29 — Codex — align chat composer with nav

Changed:
- Moved the resting chat composer up 20px so its center matches the floating nav pill's center on other screens.
- Derived the position from the shared nav height and bottom-margin constants instead of adding another hand-tuned offset.
- Compensated the keyboard animation distance so the open-keyboard gap stays at 12px.

Tried and abandoned (what didn't work, and why):
- Matching only the nav's bottom margin would align the bottom edges but not the centers because the compose controls are 44px tall and the nav pill is 60px tall.

Left for next session:
- Nothing for this task.

Assumptions made (flag if wrong):
- "Same height as the nav" means the compose controls should share the nav pill's vertical centerline while retaining their existing 44px control height.

Blockers:
- Mobile typecheck passes. Root `npm run verify` remains blocked by the two existing web-lane lint errors already recorded in the mobile state file.
