# CURRENT — web UI lane (Agent B)

**You own `app/(marketing)/`, `app/(dashboard)/`, `app/(auth)/`, `middleware.ts`,
`components/` and `lib/` only. You are the only writer of this file.**

Last updated: 2026-08-11 by Codex — live invoices list

## What exists

- The web login and dashboard route protection are live, and `/dashboard/projects`
  reads projects and clients from the API with loading, error, empty, and filtered
  states.
- `/dashboard/invoices` now reads invoices, projects, and clients from the three
  authenticated API endpoints. It shows live amounts, paid/overdue statuses,
  due dates, project links, and client names.
- The invoices screen explicitly distinguishes loading, API error with Retry,
  an empty database, and invoices that exist but do not match the current search
  or status filter.
- Invoice row actions and the create-invoice dialog are intentionally not mounted
  on the live invoices table. Their current implementations only mutate the
  local Zustand store, and no invoice write endpoint exists yet; hiding them keeps
  the page from showing changes that disappear after refresh.
- `InvoiceKind` now includes the API's `CUSTOM` value, and the existing create
  dialog has a matching `Custom` label for any future live write flow.

## Verification

- `npm run verify`: typecheck, lint, and all 9 tests passed. The required Turbopack
  build is blocked by this sandbox's `Operation not permitted` process/port
  restriction, the same known environment failure recorded in the handover.
- `npx next build --webpack`: passed; all 23 routes compiled successfully.
- The local dev server is running on `http://localhost:3001` because port 3000
  was already occupied.
- The in-app browser was unavailable in this session: browser discovery returned
  no connected backends. The required signed-in click-through could not be
  completed here and still needs Buna's browser check.

## Handoff notes

- The API invoice shape used here is `id`, `projectId`, `clientId`, `kind`,
  `label`, `amountCents`, `status`, `createdAt`, and optional `dueDate`/`paidAt`.
- The API lane's seeded data now includes three clients, due dates on every
  invoice, two past-due `SENT` invoices, and one `CUSTOM` invoice.
- `lib/types.ts` changed for `CUSTOM`; the equivalent `mobile/lib/types.ts` was
  deliberately not changed. Tell Buna/Agent C to mirror that union before mobile
  consumes custom invoices.
- Unrelated mobile files were already modified in the shared checkout and were
  not staged or changed by this lane.

## Hard rule

Never run `npm install`, `prisma migrate`, or `npx expo install` in this lane.
Commit only owned paths and this file; never use `git add -A`.
