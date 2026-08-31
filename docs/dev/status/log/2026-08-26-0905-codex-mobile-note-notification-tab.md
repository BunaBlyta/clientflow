### 2026-08-26 09:05 — Codex — keep Notifications active for note chat

Changed:
- Kept note notification navigation inside the Notifications stack using `projects/[id]/notes`.
- Preserved the Notifications bottom-tab selection instead of switching to Projects.

Tried and abandoned (what didn't work, and why):
- The shared project-tab helper opened the correct notes screen but changed the active bottom tab to Projects, unlike the existing invoice-notification behavior.

Left for next session:
- Tap a note notification from the Notifications tab and confirm the chat opens while Notifications remains highlighted.

Assumptions made (flag if wrong):
- The invoice-notification navigation is the desired pattern for note notifications.

Blockers:
- None. Mobile TypeScript check passed. Change remains uncommitted and unpushed.
