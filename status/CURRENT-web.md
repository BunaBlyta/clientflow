# CURRENT — web UI lane (Agent B)

Last updated: 2026-08-13 15:28 by Codex — clickable notification navigation

## What changed

- Added `getNotificationDestination` in `lib/notification-destination.ts` as the single notification destination mapping:
  - `invoiceId` → `/dashboard/invoices`
  - `requestId` → `/dashboard/requests/:requestId`
  - `projectId` → `/dashboard/projects/:projectId`
  - no target → `/dashboard/notifications`
- Added nullable optional `projectId`, `invoiceId`, and `requestId` fields to the web `Notification` type. Destinations use only these explicit IDs, with encoded path segments; legacy notification links and notification text/types are not used for routing.
- Applied the helper to the full Notifications page and the staff topbar dropdown.
- Unread notifications on both surfaces are marked read through `PATCH /api/notifications/:id` before navigation. Existing loading/error states remain, and the clicked dropdown item is disabled while its read update is pending.
- Added focused destination-helper tests.

## Verification

- Focused `npx vitest run lib/notification-destination.test.ts`: passed — 4 tests.
- `npm run lint`: passed.
- `git diff --check`: passed.
- An earlier full `npm run test` run passed 33 files and 136 tests before concurrent API edits landed. The final shared-checkout rerun currently fails 8 API tests because API tests still expect notification creates without the new target fields.
- The final `npm run typecheck` currently fails in API-owned routes because the concurrent Prisma notification target schema/client work is not complete. Web-owned changes introduce no type errors in the focused test.

## Handoff notes

- No API, Prisma, or mobile files were changed. The web consumes the API agent’s new optional notification target fields.
- The API agent needs to finish Prisma client generation/schema updates and update the affected API notification expectations before the repository-wide test/typecheck gate can pass.
- Concurrent mobile/Prisma changes and an unrelated untracked `public/logo.png` were left untouched and unstaged.

## Hard rule

Never run `npm install`, `prisma migrate`, or `npx expo install` in this lane.
Commit only owned paths and this file; never use `git add -A`.
