# CURRENT — mobile lane (Agent C)

Last updated: 2026-08-12 11:38 by Codex — live note posting and notification read actions

## Completed

- Mobile note reads and notification reads remain live and authenticated.
- The project notes composer now posts `{ projectId, body }` to
  `POST /api/notes`, adds only the server-created note to the store, clears the
  draft after success, and shows an error when the request fails.
- Tapping an unread notification calls `PATCH /api/notifications/[id]` before
  following its project or invoice link. The returned notification updates the
  store only after the server confirms it.
- “Mark all read” now collects the current unread notification IDs and sends one
  PATCH request per ID with `Promise.all`. Successful responses update the local
  store; a failed batch leaves local read state unchanged and shows an error.

## Verification

- `npx tsc --noEmit` from `mobile/`: passed.
- `git diff --check`: passed.
- Confirmed the API PATCH route marks the authenticated notification read without
  requiring a request body.
- No device or simulator testing was attempted; that test belongs to Buna
  because Expo Go cannot run this SDK and Xcode is not installed.

## Notes for the next session

- The mobile app still uses `http://localhost:3000` unless
  `EXPO_PUBLIC_API_URL` is set to a reachable web/API origin.
- Mark-all intentionally sends one request per unread notification because the
  API exposes only the single-notification PATCH route.
- The unrelated web notification changes and API test files in the working tree
  were not modified or staged by this lane.
