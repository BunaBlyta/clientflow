### 2026-08-25 15:33 — mobile lane — compact consecutive chat messages

Changed:
- Made received and sent chat bubbles wrap to their content instead of stretching across the chat column.
- Added a maximum bubble width so longer messages remain readable.
- Consecutive messages from the same sender now show the sender name only on the first message in the run.

Tried and abandoned (what didn't work, and why):
- None.

Left for next session:
- No follow-up work from this request.

Assumptions made (flag if wrong):
- Consecutive messages are grouped by both author name and author role, and a system message breaks a group.

Blockers:
- Browser preview inspection was unavailable because no browser connection was available in this session.
