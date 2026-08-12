# CURRENT — mobile lane (Agent C)

Last updated: 2026-08-12 by Codex — live notes and notifications read wiring

## Completed

- Added authenticated mobile API requests for `GET /api/notes` and
  `GET /api/notifications`.
- Notes now refresh from the API by project. The project detail preview and the
  full notes screen both use the live notes for the selected project, so one
  client with two projects does not mix their feeds.
- Notifications now refresh for the signed-in client, including the unread tab
  count. If the API cannot be reached, the existing saved fixture data remains
  visible with a warning.
- Confirmed the write routes do not exist yet: `POST /api/notes` and
  `PATCH /api/notifications/[id]`. Note posting and marking notifications read
  no longer changes local state; both controls are disabled with a short
  visible message until the API lane ships those routes.

## Verification

- `npx tsc --noEmit` from `mobile/`: passed.
- `git diff --check`: passed.
- Read-only contract check confirmed the projects API scopes client results to
  the authenticated client. Seed data includes two projects for the main demo
  client, and the mobile note store replaces only the selected project's notes.
- No device or simulator payment test was attempted; that test belongs to
  Buna because Expo Go cannot run this SDK and Xcode is not installed.

## Notes for the next session

- The mobile app still uses `http://localhost:3000` unless
  `EXPO_PUBLIC_API_URL` is set to a reachable web/API origin.
- When `POST /api/notes` and `PATCH /api/notifications/[id]` land, replace the
  disabled controls with API calls and refresh the affected record; do not
  restore local-only mutations.
- The checkout contains separate API-lane verification changes and an existing
  contract-audit log. They were not staged or modified by this lane.
