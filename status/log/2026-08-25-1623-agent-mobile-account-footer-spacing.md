### 2026-08-25 16:23 — mobile lane — force Account footer placement

Changed:
- Added a flexible spacer before the version line so it is visibly held at the bottom of short Account screens.
- Kept a minimum gap so the version line does not collide with the Logout action when the page needs to scroll.

Tried and abandoned (what didn't work, and why):
- Relying on the footer’s automatic top margin alone did not visibly anchor it low enough in the rendered Account layout.

Left for next session:
- No follow-up work from this request.

Assumptions made (flag if wrong):
- The version line should sit just above the bottom tab bar rather than immediately below the Logout button.

Blockers:
- Browser preview inspection was unavailable because no browser connection was available in this session.
