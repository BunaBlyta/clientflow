### 2026-08-18 15:18 — Codex — make overview lists fill available height

Changed:
- Removed the fixed five-item limit from Recent Projects and Notifications.
- Made both lists share the same expanding row behavior inside their viewport-sized cards.
- Added internal scrolling for lists that exceed the available panel height.

Tried and abandoned (what didn't work, and why):
- Keeping a fixed five-item slice left the stretched cards visibly under-filled on taller screens.

Left for next session:
- No verification was run, per the user's instruction.

Assumptions made (flag if wrong):
- Showing all available recent projects and notifications is preferable to hiding items behind a fixed five-row limit; the panel itself now controls overflow.

Blockers:
- None.
