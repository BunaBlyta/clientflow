### 2026-08-12 11:38 — mobile lane — enable note posting and notification reads

Changed:
- Added the mobile `POST /api/notes` client and wired the project note composer
  to submit authenticated notes.
- Added the mobile `PATCH /api/notifications/[id]` client.
- Wired tapping an unread notification to mark that one record read before
  navigation.
- Wired “Mark all read” to send one PATCH per unread ID with `Promise.all` and
  update the store from the server responses.
- Updated the mobile status handoff.

Tried and abandoned (what didn't work, and why):
- The first PATCH helper included a `{ read: true }` body, but the API contract
  marks the record read from the PATCH itself and does not need a body. The
  helper now sends only the PATCH method.

Left for next session:
- Buna should click note posting and both notification read actions against the
  live API and confirm persistence after reopening or refreshing the screens.

Assumptions made (flag if wrong):
- Updating the Zustand store with the server response is sufficient; no local
  optimistic mutation is needed because the API response is immediate.
- If one mark-all request fails, keeping all local unread states unchanged is
  safer than claiming the batch completed.

Blockers:
- Device and simulator testing remains with Buna; no compatible Expo Go or
  Xcode environment is available to this lane.
