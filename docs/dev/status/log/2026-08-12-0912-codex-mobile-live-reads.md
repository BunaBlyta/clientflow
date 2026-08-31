### 2026-08-12 09:12 — mobile lane — live notes and notifications read wiring

Changed:
- Added authenticated mobile reads for notes and notifications.
- Scoped note refreshes by project and added a live refresh for the project
  detail preview, so a client with two projects sees the correct feed in each.
- Refreshed notifications for the signed-in client and kept the unread badge in
  sync with the returned records.
- Removed local-only note creation and notification read mutations. The two
  unavailable write controls now show short visible notices and cannot change
  local state.

Tried and abandoned (what didn't work, and why):
- No write endpoint implementation was attempted because `POST /api/notes` and
  `PATCH /api/notifications/[id]` are not present yet and belong to the queued
  API task.

Left for next session:
- Re-enable note posting and notification read actions only after the API lane
  ships and documents both write responses.

Assumptions made (flag if wrong):
- Existing fixture data remains an acceptable fallback when the local API is
  unavailable, matching the existing live project and invoice behavior.
- The authenticated projects API is the source of truth for which projects a
  client may see; the mobile app does not add a second client filter.

Blockers:
- Device and simulator testing remains with Buna; no compatible Expo Go or
  Xcode environment is available to this lane.
