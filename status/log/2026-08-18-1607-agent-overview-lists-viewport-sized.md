### 2026-08-18 16:07 — Codex — size overview lists to viewport

Changed:
- Removed the fixed six-row cap from Recent Projects and Notifications.
- Gave both lists the same viewport-based maximum height.
- Kept 56px rows and clipped only content that does not fit, with no internal scrollbar.

Tried and abandoned (what didn't work, and why):
- A fixed six-row cap did not respond to different screen heights.

Left for next session:
- No verification was run, per the user's instruction.

Assumptions made (flag if wrong):
- A shared `100dvh`-based max height is the best CSS-native approximation of the space available for these two Overview lists.

Blockers:
- None.
