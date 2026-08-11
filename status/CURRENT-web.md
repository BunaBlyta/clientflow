# CURRENT — web UI lane (Agent B)

**You own `app/(marketing)/`, `app/(dashboard)/`, `app/(auth)/`, `middleware.ts`,
`components/` and `lib/` only. You are the only writer of this file.**

Last updated: 2026-08-11 by Codex — live project invoices

## What exists

- `/dashboard/invoices` shows real Send and Void actions backed by
  `PATCH /api/invoices/:id`; action choices come from the current invoice status.
- Manual “Mark as paid” is deleted from the UI and old mock store action. Stripe's
  confirmed webhook remains the only path to Paid.
- `/dashboard/projects` uses the existing project status menu. Status changes call
  `PATCH /api/projects/:id` and apply the returned project record.
- The project status menu trigger now passes the app's `Button` component into
  `DropdownMenuTrigger`, matching the working invoice actions trigger. The prior
  bare `<button>` rendered but did not open the Base UI menu.
- `/dashboard/projects/[id]` now loads the project, client contact, and activity feed
  from the API. The activity feed uses `GET /api/notes?projectId=…` and reads each
  note's `body` field. After a successful status PATCH, it fetches the notes again
  from the server with caching disabled instead of adding a predicted note locally.
- The project note composer is disabled and says that posting notes is not wired up
  yet, so it cannot show state that is absent from the database.
- `/dashboard/projects/[id]` now uses the additive `project.package` summary from the
  project response for package name and price. Prices are treated as serialized
  major currency units and formatted with the returned currency code.
- `/dashboard/projects/[id]` now loads its invoice rows from
  `GET /api/invoices?projectId=…`; the Zustand invoice store is no longer used on
  this page. Send/Void actions replace the matching row with the server response.

## Verification

- `npm run verify` was run after the trigger fix: typecheck, lint, and all 16 tests
  passed. The Turbopack build hit the documented sandbox process/port restriction.
- `npx next build --webpack` passed; all 25 routes compiled successfully.
- For this task, `npm run verify` passed typecheck, lint, all 19 tests, and the
  webpack fallback build. The required Turbopack build hit the documented sandbox
  process/port restriction.
- Browser verification was attempted again at the local app, but the browser runtime
  reported zero available backends. No signed-in invoice comparison, row action, or
  narrow/wide layout claim is being made from this environment.

## Handoff notes

- The project-detail page now consumes the package summary included by API commit
  `24e2f0a`; no second package request is made.
- The earlier live activity-feed behavior remains: status changes refetch notes from
  the server after the PATCH returns.
- The project-detail invoice list uses the same `/api/invoices` serializer and
  newest-first ordering as the main invoices dashboard, filtered by project ID.

## Package follow-up

- Complete for this lane. The former mock lookup and TODO were removed.

## Invoice follow-up

- Complete for this lane. The detail table no longer reads mock invoice records or
  writes invoice updates to Zustand. The invoice creation dialog remains unchanged;
  this task only replaced the existing invoice list and row-action data path.

## Hard rule

Never run `npm install`, `prisma migrate`, or `npx expo install` in this lane.
Commit only owned paths and this file; never use `git add -A`.
