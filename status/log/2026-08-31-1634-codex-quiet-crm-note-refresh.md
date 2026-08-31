### 2026-08-31 16:34 — Codex — keep open mobile notes timeline stable

Changed:
- Updated the mobile realtime coordinator to detect when the user is already viewing the affected project's notes screen.
- CRM-originated `NEW_NOTE` events still merge into live notification state, but skip the project and notes refetch while that conversation is open, preventing a visible timeline replacement or scroll jump.
- Kept normal refresh behavior for other screens and for the next notes-screen mount/focus.

Tried and abandoned (what didn't work, and why):
- None.

Left for next session:
- Device-check both `/projects/:id/notes` and `/notifications/projects/:id/notes` while posting a CRM note, confirming the open timeline stays visually stable and the notification still appears.

Assumptions made (flag if wrong):
- The unwanted refresh is the mobile app's realtime notes refetch when staff post from the CRM, rather than a browser refresh in the staff dashboard.

Blockers:
- No simulator/device was available for this check.
