### 2026-08-27 10:02 — Codex — notifications, pagination, and long note bodies

Changed:
- Added a persisted archive timestamp and supporting index for notifications.
- Added authenticated archive and restore actions without changing read state.
- Added bounded notification pagination with a `hasMore` result and an archive filter while retaining the old array response for existing callers.
- Raised the explicit note-body limit to 10,000 characters and tested the exact limit plus one character over it. Bodies are rejected when too long rather than silently shortened.
- Added the archive field to realtime notification payloads and documented the API contract.

Tried and abandoned (what didn't work, and why):
- The translation route was not added in this slice. It would send user-entered notes/messages to the external Groq service, which requires explicit approval for that data destination before implementation.
- The complete API test run was not made green because one unrelated auth verification test still expects the old response shape; changing it would exceed this task's requested paths.

Left for next session:
- After explicit approval, add and test the server-side `/api/translate` route for note/message content.
- After Buna applies the migration, exercise archive/restore against the real Neon database and wire a consuming client to the paginated envelope.

Assumptions made (flag if wrong):
- Existing notification consumers should keep their array response until they opt into `page`/`limit`.
- Active notifications are the default inbox; `archived=archived` is the archived view.
- 10,000 characters is a reasonable upper bound for a project note and its realtime copy.

Blockers:
- Buna must run `npx prisma migrate deploy` from the repository root to apply `archivedAt`.
- Translation remains blocked pending explicit approval to send user-entered content to Groq.
