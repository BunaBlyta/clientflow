# CURRENT — API & database lane (Agent A)

Last updated: 2026-08-11 by Agent A — client onboarding chain complete

## Completed

- Added public `POST /api/requests` with prospect validation and active-package
  checks.
- Added staff-only `PATCH /api/requests/[id]`. Approval creates or reuses the
  user and client atomically; rejection changes only the request.
- Approval sends the verification email after the database transaction. Email
  failure cannot roll back approval and is logged with `emailSent: false`.
- Added `POST /api/auth/set-password`, including server-side code validation,
  password hashing, account activation, code clearing, and session creation.
- Kept verification-send account-enumeration protection for unknown emails.
- Documented the onboarding contracts in `docs/ARCHITECTURE.md`.

## Verification

- `npm run verify`: typecheck passed, lint passed, and 29 tests passed.
- The normal Turbopack build is blocked only by the documented sandbox
  process/port restriction. `npx next build --webpack` passed and generated all
  27 routes.
- Real Neon/Resend chain completed for `bunablyta@gmail.com`: request created,
  approved, client linked, verification email accepted by Resend, password set
  with the delivered code, and login succeeded with a client session.

## Handoff

The onboarding chain is complete and pushed. No Prisma migration, package
install, schema change, frontend file change, or mobile file change was made.
