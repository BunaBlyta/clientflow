# CURRENT — API & database lane (Agent A)

Last updated: 2026-08-11 by Agent A

## Completed this session

- Added verification-code send and check endpoints. Codes are stored as salted hashes, expire after ten minutes, are sent through Resend, and are cleared after successful verification.
- Added authenticated list endpoints for projects, clients, notes, and notifications. Client requests are filtered to that client’s own records.
- Added the staff-only project-request list endpoint needed by the dashboard.
- Added Stripe Checkout creation and a signature-verified webhook. A confirmed payment is the only path that marks an invoice paid; a confirmed deposit moves a pending project to Discovery and writes the audit note. Repeated webhook deliveries do not duplicate payment notifications.
- Added focused Stripe signature tests. The repository now has 7 passing tests across 3 test files.

## Verification

- `npm run typecheck` — passed.
- `npm run lint` — passed with the two pre-existing unused-constant warnings in the web projects page.
- `npm run test` — passed, 7 tests.
- `npm run verify` — typecheck, lint, and tests passed; `next build` could not complete because Turbopack is blocked in this environment when it tries to create a subprocess and bind a port. The same failure occurred in both sandboxed and approved escalated runs.

## Contracts added

- `POST /api/auth/verification/send` accepts `{ email }` and returns `{ sent: true }`.
- `POST /api/auth/verification/verify` accepts `{ email, code }` and returns `{ verified, user }`.
- `GET /api/projects`, `/api/clients`, `/api/notes`, `/api/notifications`, and `/api/requests` return flat arrays with ISO date strings. Notes accept an optional `projectId` query parameter.
- `POST /api/stripe/checkout` accepts `{ invoiceId }` and returns `{ checkoutSessionId, checkoutUrl }`.
- `POST /api/stripe/webhook` requires a valid `stripe-signature` header and handles successful and failed payment events idempotently.

## Blockers / handoff

- Buna should configure `RESEND_FROM_EMAIL` if the default Resend sender is not desired, and set `STRIPE_WEBHOOK_SECRET` for local/deployed webhook handling.
- For local Stripe testing, run `stripe listen --forward-to localhost:3000/api/stripe/webhook`.
- No Prisma migration or package install was run. No migration is needed for the verification-code columns already present in the schema.
