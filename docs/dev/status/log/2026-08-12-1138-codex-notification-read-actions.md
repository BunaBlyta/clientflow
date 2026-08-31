### 2026-08-12 11:38 — Codex — notification read actions

Changed:
- Added single-notification PATCH handling to the notifications page; unread links mark themselves read before navigation.
- Added “Mark all read” by sending the existing single-notification PATCH request to every unread ID with `Promise.all`.
- Added pending and error states, preserved failed unread items, and reloaded from the server after a bulk failure to reconcile partial success.

Tried and abandoned (what didn't work, and why):
- The disabled placeholder was removed rather than adding a nonexistent bulk endpoint; the shipped API only supports one notification ID per PATCH.
- The required Turbopack build remains blocked by the sandbox process/port restriction; the webpack fallback passed.

Left for next session:
- The topbar bell still has its own notification read controls and can be aligned with this page in a follow-up.

Assumptions made (flag if wrong):
- Notification links should wait for a successful mark-read request before navigating, so a failed write stays visible and retryable on the notifications page.

Blockers:
- Turbopack build blocked by the sandbox process/port restriction; typecheck, lint, tests, and webpack build passed.
