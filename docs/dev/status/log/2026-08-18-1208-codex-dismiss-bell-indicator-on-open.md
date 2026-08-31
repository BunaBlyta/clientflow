### 2026-08-18 12:08 — Codex — dismiss bell indicator on open

Changed:
- Removed the server-backed mark-all-read behavior from opening the notifications dropdown.
- Added local tracking of notification IDs seen when the bell is opened.
- Kept the dot visible for newly arriving notifications after the dropdown was opened.

Tried and abandoned (what didn't work, and why):
- Marking all notifications as read on open changed their actual read status, which was not intended.

Left for next session:
- Changes are uncommitted as requested. No checks were run as requested.

Assumptions made (flag if wrong):
- “Opened” means dismissing the bell dot locally while preserving unread status for the notifications page and future use.

Blockers:
- None.
