# CURRENT — API & database lane (Agent A)

Last updated: 2026-08-27 10:25 by Codex — Google Cloud content translation

## What changed

- Notifications now have an independent `archivedAt` timestamp. A user's archive and restore actions are ownership-checked and never change `readAt`; an unread notification can therefore be archived and later restored as unread.
- `GET /api/notifications` excludes archived rows by default. Existing callers still receive an array of at most 200 records. Callers that send `page` and/or `limit` receive a bounded `{ notifications, page, pageSize, hasMore }` envelope; `limit` is capped at 50. `archived=active|archived|all` selects the archive view.
- Notification responses now include an additive `archived` boolean. The existing read fields and navigation IDs remain unchanged.
- Note bodies use an explicit 10,000-character limit. Accepted bodies are not truncated; a body over the limit returns 400. The limit is covered at both the accepted boundary and one character over it.
- `POST /api/translate` now authenticates both staff and clients, validates note/message text and `en`/`sq`/`de` language inputs, and sends one plain-text request to Google Cloud Translation without storing or overwriting the original. `sourceLanguage: "auto"` is supported for provider auto-detection.
- Google Cloud Translation Basic (v2) is called only with the server-side `GOOGLE_TRANSLATE_API_KEY` in the `x-goog-api-key` header. The endpoint maps app languages to Google's lowercase `en`, `sq`, and `de` codes; missing configuration returns 503, provider failures return 502, and a 10-second timeout returns 504.
- Updated the API architecture contract and realtime notification payload to carry archive state.

## Verification

- Google translation suite: 8 tests passed, covering authentication, validation, the shared length boundary, missing configuration, Albanian provider success, provider failure, language mapping, auto-detection, and timeout handling.
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

Buna must create or select a Google Cloud project, enable the Cloud Translation API, create an API key restricted to that API, and add `GOOGLE_TRANSLATE_API_KEY` to the server environment for local development and Vercel. No key was added to the repository, printed, placed in the URL, or sent to mobile. The route reads only the unprefixed server variable, so it is not exposed through the Next.js client bundle.

## Handoff

- The paginated notification request must not include `since`; realtime catch-up keeps the legacy array response.
- `PATCH /api/notifications/:id` with no body marks the notification read. `{ "archived": true }` archives it and `{ "archived": false }` restores it without changing read state.
- The migration file is `prisma/migrations/20260827090000_add_notification_archiving/migration.sql`.
- Google Cloud's language support includes Albanian (`sq`), so the provider can serve all three app languages without a fallback translation path.
- Concurrent Claude work in `mobile/**` was left untouched and unstaged.
