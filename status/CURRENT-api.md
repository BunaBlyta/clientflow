# CURRENT — API & database lane (Agent A)

Last updated: 2026-08-27 10:46 by Codex — MyMemory content translation

> **2026-08-27 ~16:50 — added by Claude Code (out-of-lane, with Buna's go-ahead).**
> New self-serve account endpoints, no schema change (uses existing
> `Client.companyName` / `Client.phone`):
> - `GET /api/auth/me` — client responses now also return `companyName` + `phone`.
> - `PATCH /api/auth/me` (new) — edits own `{ name?, companyName?, phone? }`;
>   `name` syncs `User.name` + `Client.name`; company/phone client-only; empty
>   string clears to null; returns the `GET /me` shape. Email not editable.
> - `POST /api/auth/change-password` (new) — `{ currentPassword, newPassword }`,
>   verifies current hash, new ≥ 8 chars and must differ, rehashes → `{ success: true }`.
> - `login` + `set-password` responses now include `companyName`/`phone` in `user`.
> Tests: `app/api/auth/me/route.test.ts` (extended), `app/api/auth/change-password/route.test.ts` (new).
> `npx vitest run` → 204 pass, 1 pre-existing unrelated failure. Full detail:
> `status/log/2026-08-27-1650-claude-account-edit-profile-password.md`.

## What changed

- Notifications now have an independent `archivedAt` timestamp. A user's archive and restore actions are ownership-checked and never change `readAt`; an unread notification can therefore be archived and later restored as unread.
- `GET /api/notifications` excludes archived rows by default. Existing callers still receive an array of at most 200 records. Callers that send `page` and/or `limit` receive a bounded `{ notifications, page, pageSize, hasMore }` envelope; `limit` is capped at 50. `archived=active|archived|all` selects the archive view.
- Notification responses now include an additive `archived` boolean. The existing read fields and navigation IDs remain unchanged.
- Note bodies use an explicit 10,000-character limit. Accepted bodies are not truncated; a body over the limit returns 400. The limit is covered at both the accepted boundary and one character over it.
- `POST /api/translate` now authenticates both staff and clients, validates note/message text and `en`/`sq`/`de` language inputs, and sends user-entered content to MyMemory without storing or overwriting the original. The mobile `sourceLanguage: "auto"` contract remains supported through a server-side best-effort source detector.
- MyMemory's public `GET /get` endpoint receives `q`, `langpair`, and `mt=1`. App languages map directly to `en`, `sq`, and `de`; content is split into conservative 450-byte chunks, reassembled in order, and bounded to 80 provider calls. Missing responses/provider failures return 502, and a 10-second timeout returns 504.
- Updated the API architecture contract and realtime notification payload to carry archive state.

## Verification

- MyMemory translation suite: 12 tests passed, covering authentication, validation, the shared length boundary, no-key operation and optional email, Albanian/German/English paths, auto source detection, chunking/reassembly, missing provider response, provider failure, and timeout handling.
- `npx tsc --noEmit`: passed.
- `npx eslint app/api/translate/route.ts app/api/translate/route.test.ts`: passed.
- Full available test suite: 38 files and 190 tests passed; 1 unrelated pre-existing auth verification assertion failed because it expects `{ sent: true }` while the current route returns `{ sent: true, registered: true }`. No auth files were changed.
- Focused notification/note suite: 4 files, 20 tests passed.
- `npx prisma generate`: passed after the schema change. It only refreshed ignored generated code.

## Migration

The archive column and index are prepared but not applied to Neon. Buna must run this exact command from the repository root after reviewing the migration:

```text
npx prisma migrate deploy
```

Do not run that command concurrently with another migration.

## Environment handoff

Buna does not need to add a provider key. MyMemory works without credentials or billing setup. Optionally add `MYMEMORY_EMAIL` to the server environment for the higher free daily quota; it stays server-only and is never logged, stored, or sent by mobile. No user text is logged or persisted.

## Handoff

- The paginated notification request must not include `since`; realtime catch-up keeps the legacy array response.
- `PATCH /api/notifications/:id` with no body marks the notification read. `{ "archived": true }` archives it and `{ "archived": false }` restores it without changing read state.
- The migration file is `prisma/migrations/20260827090000_add_notification_archiving/migration.sql`.
- MyMemory has no source autodetection in this integration. For mobile's `sourceLanguage: "auto"`, the server's best-effort detector selects `en`, `sq`, or `de`; genuinely ambiguous text returns 422 rather than silently assuming English.
- No migration is needed for the provider switch.
- Concurrent Claude work in `mobile/**` was left untouched and unstaged.
