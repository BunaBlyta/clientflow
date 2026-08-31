### 2026-08-18 08:31 — Codex — triangle-shaped landing hero headline

Changed:
- Added deliberate three-line breaks to the English hero headline so the centered text forms a soft triangle.
- Made the hero heading preserve translated line breaks with `whitespace-pre-line`.

Tried and abandoned (what didn't work, and why):
- Browser visual inspection was unavailable because no browser instance was connected. The user will perform the visual check.

Left for next session:
- Nothing beyond the user’s visual review.

Assumptions made (flag if wrong):
- The intended triangle is a centered headline whose lines widen from top to bottom.

Blockers:
- The default Turbopack build is blocked by the sandbox’s port-binding restriction. The webpack production build passed.
