# CURRENT — web UI lane (Agent B)

**You own `app/(marketing)/`, `app/(dashboard)/`, `app/(auth)/`, `middleware.ts`,
`components/` and `lib/` only. You are the only writer of this file.**

Last updated: 2026-08-11 by Codex — live project detail activity feed

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

## Verification

- `npm run verify` was run after the trigger fix: typecheck, lint, and all 16 tests
  passed. The Turbopack build hit the documented sandbox process/port restriction.
- `npx next build --webpack` passed; all 25 routes compiled successfully.
- For this task, `npm run verify` passed typecheck, lint, all 16 tests, and the
  webpack fallback build. The required Turbopack build hit the documented sandbox
  process/port restriction.
- Browser verification was attempted at the local app, but the browser runtime
  reported zero available backends. No signed-in status change, narrow/wide layout
  check, or reload persistence claim is being made from this environment.

## Handoff notes

- The one source change in this follow-up is the trigger primitive in
  `components/dashboard/project-status-menu.tsx`; the API and `patchJson` were
  already proven by the invoice action flow.
- If the real-browser check finds another issue, inspect the rendered trigger and
  Base UI menu state before changing the API layer.

## Package follow-up

- The detail page keeps `getPackage` only for package name and pricing, with a TODO
  marking the missing API fields. Swap this lookup for `GET /api/packages` when the
  API lane adds it and the project response includes the package relation.

## Hard rule

Never run `npm install`, `prisma migrate`, or `npx expo install` in this lane.
Commit only owned paths and this file; never use `git add -A`.
