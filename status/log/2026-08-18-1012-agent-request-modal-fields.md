### 2026-08-18 10:12 — Codex — refine light-mode request modal fields

Changed:
- Removed the light-mode request modal title gradient that was rendering as a dark strip behind the heading.
- Made the light-mode text fields slightly darker blue-gray and removed their outer and focus outlines.
- Kept dark-mode field styling unchanged.

Tried and abandoned (what didn't work, and why):
- No implementation was abandoned.

Left for next session:
- Nothing specific; the user can visually check the updated modal.

Assumptions made (flag if wrong):
- “Active fields” means the request modal inputs and select trigger, including their focused state.

Blockers:
- The default Turbopack build still hits the known sandbox process/port-binding panic; the webpack build passed.
