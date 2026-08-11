# CURRENT — API & database lane (Agent A)

Last updated: 2026-08-11 by Agent A — invoice endpoints and seed data

## Completed

- Added authenticated `GET /api/invoices` and `GET /api/invoices/:id` routes.
- Staff can see every invoice. Client sessions only see invoices for their own client; another client’s invoice returns 404 rather than revealing that it exists.
- The list route accepts `?projectId=` and sorts newest first.
- Both routes return this flat shape: `id`, `projectId`, `clientId`, `kind`, `label`, `amountCents`, `status`, `createdAt`, plus optional `dueDate` and `paidAt` ISO strings. `kind` preserves `CUSTOM`; `label` has a fallback when the database description is empty; amounts are converted from major currency units to cents.
- Added tests for the amount conversion and nullable-description fallback. The repository now has 9 passing tests across 4 files.
- Updated the seed with two additional client accounts, moved projects 3 and 4 (and their invoices) to those clients, added due dates to every invoice, and added two past-due `SENT` invoices. Riverside still owns projects 1 and 2.

## Verification

- `npm run verify` — typecheck, lint, and all 9 tests passed. The required Turbopack build still fails in this sandbox because it cannot create a process and bind a port (`Operation not permitted`).
- `npx next build --webpack` — passed; all 23 pages/routes, including both invoice routes, compiled successfully.
- `git diff --check` — passed.

## Seed demo accounts

- Riverside: `jordan@riversidecoffee.com` / `riverside123` — projects 1 and 2.
- Northstar: `maya@northstarwellness.com` / `northstar123` — project 3.
- Atelier Forma: `leo@atelierforma.com` / `atelier123` — project 4.

## Handoff / blockers

- Frontend agents should widen their invoice kind union to include `CUSTOM` and consume `amountCents` rather than the database amount.
- Buna should configure `RESEND_FROM_EMAIL` if the default Resend sender is not desired, and set `STRIPE_WEBHOOK_SECRET` for local/deployed webhook handling.
- For local Stripe testing, run `stripe listen --forward-to localhost:3000/api/stripe/webhook`.
- No Prisma migration or package install was run; the existing schema already contains all required columns.
