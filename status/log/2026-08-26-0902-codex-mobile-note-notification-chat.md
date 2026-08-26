### 2026-08-26 09:02 — Codex — open note notifications in chat

Changed:
- Note notifications in the mobile Notifications list now open the project notes/chat route directly.
- Reused the shared project-tab navigation helper so the notification tab remains the origin when navigating back.

Tried and abandoned (what didn't work, and why):
- The list's old direct navigation treated every project notification as a project-overview destination, which ignored the note-specific chat target already used by push notifications.

Left for next session:
- Test tapping a `NEW_NOTE` notification from the in-app list and confirm it opens the chat.

Assumptions made (flag if wrong):
- “Chat” refers to the existing project notes screen at `projects/[id]/notes`.

Blockers:
- None. Mobile TypeScript check passed. Change remains uncommitted and unpushed by request.
