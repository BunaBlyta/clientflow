# CURRENT — web UI lane (Agent B)

Last updated: 2026-08-13 15:46 by Codex — notification target data diagnosis

## What changed

- Rechecked both staff notification consumers after the API/Prisma client update: the full `/dashboard/notifications` page and the topbar dropdown still use the shared ID-based destination helper and read-before-navigation behavior.
- The authenticated live `GET /api/notifications` response is now HTTP 200 and parses correctly. However, every existing notification returned in the live staff account has `projectId: null`, `invoiceId: null`, and `requestId: null`.
- With no target ID, the required helper destination is `/dashboard/notifications`, so clicking an existing notification returns to the same page and appears to do nothing. The web must not infer a project/request/invoice from notification text or type.
- No web code change was appropriate: the remaining issue is missing target data in the live database, not fetchJson, authentication, loading/error state, rendering, or invalid URL handling.

## Verification

- Authenticated live API check: `GET /api/notifications` returned HTTP 200 with a valid array; all current records had nullable targets.
- `npm run test`: passed — 34 files, 138 tests.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `git diff --check`: passed.
- Browser automation was unavailable in this session, but the live authenticated response and source click handlers were inspected directly.

## Handoff notes

- API/data action required: apply the notification target migration if it has not been applied, then create or seed notifications through the updated API/seed flow so applicable records contain target IDs. Existing records with all three fields null cannot be repaired safely from web code without violating the no-inference contract.
- API handoff specifies `npx prisma migrate dev --name add-notification-navigation-targets`; the seed flow should be rerun deliberately if seeded notifications are needed. This web lane did not run either command.
- No API, Prisma, or mobile files were changed. Unrelated untracked `public/logo.png` remains untouched.

## Hard rule

Never run `npm install`, `prisma migrate`, or `npx expo install` in this lane.
Commit only owned paths and this file; never use `git add -A`.
