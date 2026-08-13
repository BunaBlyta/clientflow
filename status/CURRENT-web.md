# CURRENT — web UI lane (Agent B)

Last updated: 2026-08-13 15:52 by Codex — fix notification click navigation

## What changed

- Fixed notification clicks on the full Notifications page and the topbar dropdown.
- Both surfaces now prevent the anchor’s default action and explicitly navigate with `router.push()` after marking an unread notification read. This avoids losing navigation when the async PATCH or dropdown dismissal occurs during the click.
- Topbar notification entries now use the existing shadcn/Base UI `DropdownMenuItem` with a rendered Next `Link`, so the menu treats them as real menu items while preserving the shared target destination helper.
- The target mapping remains ID-only: invoice → invoices, request → request detail, project → project detail, and no target → notifications.

## Verification

- `npm run test`: passed — 34 files, 138 tests.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `git diff --check`: passed.
- Live API check after migration: `GET /api/notifications` returned HTTP 200 with `requestId: "req-1"` on the seeded target notification; `PATCH /api/notifications/notif-8` returned HTTP 200, and `/api/requests/req-1` returned HTTP 200.

## Handoff notes

- No API, Prisma, mobile, or payment files were changed.
- Unrelated untracked `public/logo.png` remains untouched.

## Hard rule

Never run `npm install`, `prisma migrate`, or `npx expo install` in this lane.
Commit only owned paths and this file; never use `git add -A`.
