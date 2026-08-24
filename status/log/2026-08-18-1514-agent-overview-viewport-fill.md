### 2026-08-18 15:14 — Codex — make overview fill the viewport

Changed:
- Made the Overview use the available viewport height on larger screens.
- Let the Recent Projects and Notifications cards grow together so the page no longer ends early with unused space below it.

Tried and abandoned (what didn't work, and why):
- The Work queue alone did not solve the problem because the page remained content-height-driven and still ended before the viewport.

Left for next session:
- No verification was run, per the user's instruction.

Assumptions made (flag if wrong):
- The extra height should be absorbed by the existing Recent Projects and Notifications panels rather than introducing another repeated analytics visualization.

Blockers:
- None.
