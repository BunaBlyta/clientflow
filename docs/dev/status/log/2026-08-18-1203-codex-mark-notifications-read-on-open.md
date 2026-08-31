### 2026-08-18 12:03 — Codex — mark notifications read on open

Changed:
- Wired the notification dropdown open event to mark all currently unread notifications as read.
- Reused the existing server-backed bulk read action, including cross-tab synchronization and error handling.

Tried and abandoned (what didn't work, and why):
- None.

Left for next session:
- Changes are uncommitted as requested. No checks were run as requested.

Assumptions made (flag if wrong):
- Opening the notification dropdown should mark every notification currently shown in it as read and clear the bell dot.

Blockers:
- None.
