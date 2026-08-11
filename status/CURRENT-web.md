# CURRENT — web UI lane (Agent B)

**You own `app/(marketing)/`, `app/(dashboard)/`, `app/(auth)/`, `middleware.ts`,
`components/` and `lib/` only. You are the only writer of this file.**

Last updated: 2026-08-11 by Codex — project status trigger fix

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

## Verification

- `npm run verify` was run after the trigger fix: typecheck, lint, and all 16 tests
  passed. The Turbopack build hit the documented sandbox process/port restriction.
- `npx next build --webpack` passed; all 25 routes compiled successfully.
- Browser re-verification is **pending** in this lane. The browser runtime again
  returned zero available backends, so this lane did not open the menu, change a
  status, or confirm persistence after reload. Buna reported the pre-fix failure
  from a real browser and is running the post-fix check separately.

## Handoff notes

- The one source change in this follow-up is the trigger primitive in
  `components/dashboard/project-status-menu.tsx`; the API and `patchJson` were
  already proven by the invoice action flow.
- If the real-browser check finds another issue, inspect the rendered trigger and
  Base UI menu state before changing the API layer.

## Hard rule

Never run `npm install`, `prisma migrate`, or `npx expo install` in this lane.
Commit only owned paths and this file; never use `git add -A`.
