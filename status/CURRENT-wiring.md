# CURRENT — data wiring vertical (Agent C)

**You are the only writer of this file. Overwrite it before you stop.
Do not edit another agent's CURRENT-*.md.**

Last updated: 2026-08-11 by Claude (Cowork) — initial setup

## The situation

**Every screen in the app shows fake data.** Nine web pages and the whole mobile
app read from `lib/mock-data.ts` / `mobile/lib/mock-data.ts` via Zustand stores.
The database is live and seeded, but almost nothing queries it. Closing that gap
is your entire job.

## What exists

- `GET /api/projects/:id` — the only data endpoint. Auth-protected, accepts
  cookie or bearer token, returns a flat shape (IDs only, no nested relations),
  dates as ISO strings. A CLIENT gets 404 for another client's project.
  **Copy this route's conventions exactly** for the ones you add.
- Seeded data: 3 packages, 4 projects across stages, 11 invoices covering every
  status, 13 notes, 7 notifications, 3 project requests.
- Web pages, all on mock data: `/dashboard`, `/dashboard/clients`,
  `/dashboard/projects`, `/dashboard/projects/[id]`, `/dashboard/analytics`,
  `/dashboard/notifications`, `/dashboard/settings`, plus the marketing page.

## Your job, in order

1. `GET /api/projects` (list), then convert `/dashboard/projects` and
   `/dashboard/projects/[id]` off mock data. **Do one screen completely — loading
   state, error state, empty state — before starting the next.** The contract has
   never been exercised inside a real component.
2. `GET /api/clients`, `/api/notes`, `/api/notifications`, `/api/requests` and
   their screens.
3. Mobile: swap the Zustand store's initial state and actions for `fetch` calls
   with the same shapes. Screens should barely change.

## Known type mismatches to reconcile

- `Project.packageId` is **nullable in Prisma but required in both frontend
  types** — deliberate, so custom projects can exist without a package
  (AGENTS.md §4). All four seeded projects happen to have one, so this has not
  broken yet. The frontend types need `string | null` and the UI needs a
  fallback. `getPackage(project.packageId)` is called in at least two places.
- Prisma has `description`, `startedAt`, `launchedAt` that no frontend type
  includes. Ignore unless a screen needs them.
- `lib/types.ts` and `mobile/lib/types.ts` are shared files and **you are the
  tiebreaker owner** — but tell Buna before changing them, since the auth and
  Stripe agents read them.

## Yours to touch

`app/api/projects/**`, `app/api/clients/**`, `app/api/notes/**`,
`app/api/notifications/**`, `app/api/requests/**`,
`app/(dashboard)/dashboard/{clients,projects,analytics,notifications,settings}/**`,
`lib/store.ts`, `lib/mock-data.ts`, `lib/analytics.ts`,
`mobile/app/(app)/projects/index.tsx`, `mobile/app/(app)/notes*`,
`mobile/app/(app)/notifications.tsx`, and this file.

Not yours: anything under `app/api/auth/`, `app/api/stripe/`,
`app/api/invoices/`, `app/(auth)/`, or the invoice screens.
