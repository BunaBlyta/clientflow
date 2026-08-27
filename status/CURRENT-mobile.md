# CURRENT — mobile lane (Agent C)

Last updated: 2026-08-27 10:08 by Codex — notifications, long notes, and server translation client

## Current state

- Notifications now request one bounded 20-item page, load the next page near the end of the list, merge realtime/push refreshes by notification ID, and preserve the newest server data without duplicates.
- Notifications have Active and Archived views. Archive and restore send { "archived": boolean } to the authenticated notification endpoint and preserve the notification's read state locally.
- The notification client accepts the documented paginated envelope and the older array response while the API rollout settles. The client uses archived=all so unarchive can work from the mobile app.
- Long notes use the API's 10,000-character limit. The composer scrolls for long drafts, shows a localized character count/error, keeps the complete draft on a failed send, and only clears it after the server accepts the note.
- Human-authored note bodies and NEW_NOTE notification bodies translate asynchronously through the authenticated /api/translate route. Results are deduplicated and cached in memory; provider errors, missing routes, missing tokens, and internal i18n-looking keys fall back to the original content without blocking the feed. System note text and localized notification templates stay on the existing deterministic i18n path.
- Verification: npx tsc --noEmit passes from mobile/; git diff --check passes. No package installation or API files were changed. This lane was not verified on a physical device or simulator.

## API dependencies / next actions

- The API lane has prepared notification archive persistence, but its Prisma migration is not applied to Neon. After reviewing the migration, Buna must run npx prisma migrate deploy once from the repository root; do not run it concurrently with another migration.
- A concurrent API-lane `/api/translate` implementation is now visible in the checkout but is still untracked and outside this mobile commit. It must be committed/deployed as an authenticated route using the server-side DEEPL_API_KEY; the mobile client sends { text, targetLanguage, sourceLanguage: 'auto' } and safely keeps the original when the route is unavailable.
- The current paginated notification envelope does not include a global unread total. Mobile unread state is kept consistent for loaded and realtime notifications, but an exact unread badge when unread records exist beyond the loaded pages requires an API-provided unread count (or equivalent endpoint).
