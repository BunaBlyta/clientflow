# CURRENT — API & database lane (Agent A)

Last updated: 2026-08-27 10:02 by Codex — notifications, long notes, and translation handoff

## What changed

- Notifications now have an independent `archivedAt` timestamp. A user's archive and restore actions are ownership-checked and never change `readAt`; an unread notification can therefore be archived and later restored as unread.
- `GET /api/notifications` excludes archived rows by default. Existing callers still receive an array of at most 200 records. Callers that send `page` and/or `limit` receive a bounded `{ notifications, page, pageSize, hasMore }` envelope; `limit` is capped at 50. `archived=active|archived|all` selects the archive view.
- Notification responses now include an additive `archived` boolean. The existing read fields and navigation IDs remain unchanged.
- Note bodies use an explicit 10,000-character limit. Accepted bodies are not truncated; a body over the limit returns 400. The limit is covered at both the accepted boundary and one character over it.
- Updated the API architecture contract and realtime notification payload to carry archive state.

## Verification

- `npx tsc --noEmit`: passed.
- Focused notification/note suite: 4 files, 20 tests passed.
- Full API suite: 34 files, 167 passed and 1 unrelated pre-existing auth verification test failed because it expects `{ sent: true }` while the current route returns `{ sent: true, registered: true }`. No auth files were changed.
- API-owned ESLint files passed; Prisma schema is intentionally ignored by ESLint configuration.
- `npx prisma generate`: passed after the schema change. It only refreshed ignored generated code.

## Migration

The archive column and index are prepared but not applied to Neon. Buna must run this exact command from the repository root after reviewing the migration:

```text
npx prisma migrate deploy
```

Do not run that command concurrently with another migration.

## Translation handoff

No translation route was added in this commit. Sending user-entered note/message text to Groq is an external data transfer and requires explicit approval for that destination. Once approved, add the authenticated `/api/translate` route and tests under the assigned paths, using the existing Groq raw-fetch convention and the shared 10,000-character limit.

## Handoff

- The paginated notification request must not include `since`; realtime catch-up keeps the legacy array response.
- `PATCH /api/notifications/:id` with no body marks the notification read. `{ "archived": true }` archives it and `{ "archived": false }` restores it without changing read state.
- The migration file is `prisma/migrations/20260827090000_add_notification_archiving/migration.sql`.
- Concurrent Claude work in `mobile/**` was left untouched and unstaged.
