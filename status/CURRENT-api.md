# CURRENT — API & database lane (Agent A)

Last updated: 2026-08-11 by Agent A — status write endpoints complete

## Completed

- Added staff-only `PATCH /api/invoices/:id` accepting `{ "status": InvoiceStatus }`.
- The invoice endpoint uses `prisma/invoice-state.ts`, returns 400 for invalid status JSON, 401 for no session, 403 for clients, 404 for missing invoices, and 409 for illegal transitions.
- Manual invoice updates cannot target `PAID` or `REFUNDED`; Stripe's verified webhook remains the only payment confirmation path, and refunds remain out of scope.
- The invoice PATCH response is the existing serialized invoice shape: `id`, `projectId`, `clientId`, `kind`, `label`, `amountCents`, `status`, `createdAt`, with optional ISO `dueDate` and `paidAt`.
- Added staff-only `PATCH /api/projects/:id` accepting `{ "status": ProjectStatus }`.
- The project endpoint returns the existing flat project shape: `id`, `clientId`, `packageId`, `name`, `status`, `createdAt`, `updatedAt`, with optional ISO `targetLaunchDate`.
- Each changed project status atomically creates a system note using the existing wording pattern, for example `Status changed from Design to Development.` Same-status requests return the current project without creating a note.
- Added endpoint tests covering client refusal, legal updates, invalid statuses, illegal invoice transitions, and the payment-gated `SENT → PAID` rejection. The suite now has 16 passing tests across 6 files.
- Updated `docs/ARCHITECTURE.md` with both request/response contracts and error behavior.

## Verification

- `npm run verify` was run on 2026-08-11: typecheck, lint, and all 16 tests passed.
- The required Turbopack `next build` failed only at the documented sandbox process/port restriction (`Operation not permitted`).
- `npx next build --webpack` passed, including all 25 static pages and API routes.
- No Prisma migration, package install, schema change, or frontend file change was made.

## Handoff

Agent B can call the two PATCH routes with the request bodies above and replace local table mutations with the returned objects. The API remains staff-only for writes; clients continue to read their own invoices/projects and pay through Stripe.
