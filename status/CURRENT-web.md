# CURRENT — web UI lane (Agent B)

You own `app/(marketing)/`, `app/(dashboard)/`, `app/(auth)/`, `middleware.ts`,
`components/` and `lib/` only. You are the only writer of this file.

Last updated: 2026-08-12 by Codex — dashboard live data

## What changed

- `/dashboard/analytics` and `/dashboard` now load invoices and projects from the
  API before calculating their tiles, charts, and project lists. The overview also
  loads project requests from `GET /api/requests`.
- `/dashboard/clients` now loads clients, projects, and invoices from the API, so
  project counts and paid totals are based on database records. The resend invite
  menu is disabled with a short explanation because its write endpoint does not
  exist.
- `/dashboard/notifications` and the topbar bell now load `GET /api/notifications`.
  Notification links remain usable, but read and mark-all-read actions are disabled
  with an explanation because `PATCH /api/notifications/[id]` is not present.
- The projects list now uses the package name included in each live project record.
  Its requests tab now loads requests and package names from the API and sends
  approve/reject changes through the existing request PATCH route.
- Added `lib/fetch-json.ts` to share the existing authenticated, no-store fetch and
  error handling pattern across these screens.

## Verification

- `npm run verify`: typecheck and lint passed; the final run reached Vitest with
  24 of 30 tests passing. Six API-lane tests fail because their Prisma mocks do
  not implement the newer `$transaction`/notification behavior; no web-owned test
  failed. The required Turbopack build was blocked by the sandbox's process/port
  permission.
- `npx next build --webpack`: passed; all 27 routes compiled.
- Authenticated HTTP smoke checks passed: `/dashboard` and
  `/dashboard/analytics` returned 200, and the staff API returned live invoices,
  projects, and an empty notifications array. The live invoice data checked by
  hand totals $11,850 paid and $1,550 outstanding.
- Browser click-through at narrow and wide sizes could not be completed because
  the browser runtime reported no available browser backends. No visual browser
  verification claim is being made.

## Handoff notes

- `GET /api/auth/me` is not present, so the topbar still uses the existing seeded
  `currentStaffUser` identity. Enable live staff identity when that endpoint ships.
- Settings, marketing, note posting, invoice creation, and invitation sending were
  intentionally left alone or disabled because their required write endpoints are
  outside this brief or are not available.
- The notification read control should be enabled only after the API lane ships and
  documents `PATCH /api/notifications/[id]`.

## Hard rule

Never run `npm install`, `prisma migrate`, or `npx expo install` in this lane.
Commit only owned paths and this file; never use `git add -A`.
