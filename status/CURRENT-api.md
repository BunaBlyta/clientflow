# CURRENT — API & database lane (Agent A)

Last updated: 2026-08-11 by Agent A — client onboarding chain

## Completed

- Added public `POST /api/requests`. It validates the prospect details and
  requires an active package before creating a pending request. It does not
  create an account or client record.
- Added staff-only `PATCH /api/requests/[id]` for approval and rejection. An
  approval creates or reuses the user and client inside one database
  transaction; rejection changes only the request and creates nothing else.
- Approval sends the verification email only after the database transaction
  commits. If Resend fails, the approval remains successful, the response says
  `emailSent: false`, and the failure is logged.
- Added `POST /api/auth/set-password`. It checks the stored, unexpired code
  again on the server, hashes a password of at least eight characters, clears
  the code, activates the user, and returns the normal login session shape.
- Kept the verification-send account-enumeration protection: unknown emails
  still receive `{ sent: true }`.
- Documented the onboarding API contracts in `docs/ARCHITECTURE.md`.

## Verification

- `npm run verify` ran: typecheck passed, lint passed, and 29 tests passed.
- The normal Turbopack build failed only at the documented sandbox process/port
  restriction. `npx next build --webpack` passed and generated all 27 routes.
- Against the real Neon database, request `cmsosgpm70000ozoftbusakum` was
  created for `bunablyta@gmail.com`, approved, linked to client
  `cmsosgpza0002ozofp656k5ez`, and Resend accepted the verification email.

## Handoff

The code is ready for the final real-chain step: use the six-digit code delivered
to `bunablyta@gmail.com` with `POST /api/auth/set-password`, then log in with the
new password. The approval and email-send portions are already proven against
the real database and Resend.

No Prisma migration, package install, schema change, frontend file change, or
mobile file change was made.
