# CURRENT — API & database lane (Agent A)

Last updated: 2026-08-11 by Agent A — task brief reviewed; implementation waiting for confirmation

## Current task

The status-write brief asks for exactly two endpoints: staff-only `PATCH /api/invoices/:id` and staff-only `PATCH /api/projects/:id`. No implementation has started because confirmation was requested before code changes.

## Existing API state

- Authenticated invoice list/detail endpoints are live and return the flat serialized invoice shape: `id`, `projectId`, `clientId`, `kind`, `label`, `amountCents`, `status`, `createdAt`, with optional ISO `dueDate` and `paidAt`.
- The seed contains three client demo accounts and invoices across multiple statuses.
- The existing invoice state machine must remain unchanged; Stripe remains the only path to `PAID`.
- The project API shape and the Stripe webhook's system-note wording must be inspected before implementing the project PATCH endpoint.

## Verification run

- `npm run verify` was run on 2026-08-11.
- Typecheck, lint, and all 9 tests passed.
- The required Turbopack `next build` failed in the sandbox because it cannot create a process and bind a port (`Operation not permitted`); no source failure was reported.
- No code, Prisma schema, migration, or dependency changes were made during this inspection.

## Handoff

Awaiting confirmation to implement the two endpoints and their endpoint-level tests. Keep scope to `app/api/**` and `prisma/`; do not touch frontend files. `REFUNDED` remains out of scope for the manual invoice PATCH endpoint.
