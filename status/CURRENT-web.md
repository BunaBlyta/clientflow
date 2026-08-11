# CURRENT — web UI lane (Agent B)

**You own `app/(marketing)/`, `app/(dashboard)/`, `app/(auth)/`, `middleware.ts`,
`components/` and `lib/` only. You are the only writer of this file.**

Last updated: 2026-08-11 by Codex — live table actions

## What exists

- `/dashboard/invoices` now shows real row actions backed by
  `PATCH /api/invoices/:id`. Draft invoices can be sent, and Draft, Sent,
  Payment Pending, or Failed invoices can be voided after confirmation.
- The invoice action menu derives its choices from the current server status.
  It shows API error messages, including an unexpected 409, and only updates the
  row with the record returned by the server.
- Manual “Mark as paid” was deleted from the UI and its old mock store action was
  removed. Stripe's confirmed webhook remains the only path to Paid.
- `/dashboard/projects` now uses the existing project status menu. Status changes
  call `PATCH /api/projects/:id` and replace the row with the returned record.
- The shared project and invoice controls no longer invent successful local
  transitions when they appear on the remaining mock-backed project detail page;
  they apply only records returned by the API.

## Verification

- `npm run verify` was run after the changes: typecheck, lint, and all 16 tests
  passed. The Turbopack build then hit the documented sandbox restriction while
  trying to create a process and bind a port.
- `npx next build --webpack` passed; all 25 routes compiled successfully.
- A signed-in browser click-through is **pending**. The browser runtime returned
  zero available browser backends, so Send, Void, project status changes, and
  refresh persistence have not been verified through the UI by this lane.
- Buna is running the signed-in click-through separately and will report any bugs
  as follow-up work.

## Handoff notes

- Invoice actions intentionally expose only Send and Void. Do not reintroduce a
  manual Paid action.
- The UI prevents known illegal invoice transitions; server error text is still
  surfaced if the record changes concurrently and the API returns 409.
- Other dashboard screens remain on their previous data sources; Requests,
  create-invoice, and Settings were not changed.

## Hard rule

Never run `npm install`, `prisma migrate`, or `npx expo install` in this lane.
Commit only owned paths and this file; never use `git add -A`.
