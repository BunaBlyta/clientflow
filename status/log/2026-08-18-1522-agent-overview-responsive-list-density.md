### 2026-08-18 15:22 — Codex — make overview list density responsive

Changed:
- Removed the internal scrollbars from Recent Projects and Notifications.
- Made the panels show five rows by default, six on large screens, eight on extra-large screens, and ten on very wide screens.
- Kept the visible rows expanding to use the available card height.

Tried and abandoned (what didn't work, and why):
- Showing every item with an internal scrollbar conflicted with the requested no-scrollbar Overview panels.

Left for next session:
- No verification was run, per the user's instruction.

Assumptions made (flag if wrong):
- Responsive breakpoints are the right way to add density as screen size grows while keeping the panels bounded and scrollbar-free.

Blockers:
- None.
