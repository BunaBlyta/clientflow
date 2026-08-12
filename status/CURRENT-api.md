# CURRENT — API & database lane (Agent A)

Last updated: 2026-08-12 by Agent A — Flow A verification repair complete

## Completed

- Kept `POST /api/auth/verification/verify` as a read-only code check. It now
  returns the user without activating the account, marking the email verified,
  or clearing the code.
- Extended verification-code lifetime from 10 minutes to 30 minutes so a client
  has a practical window to read the onboarding email.
- Added a route-level test for the real send → verify → set password → login
  sequence. It proves the code survives the check and is consumed only by
  `POST /api/auth/set-password`.

## Verification

- `npm run verify`: typecheck, lint, and all 30 tests passed. The normal build
  hit the documented sandbox-only Turbopack port restriction.
- `npx next build --webpack` passed and generated all 27 routes.

## Handoff

Task 1 is committed and pushed on its own. Task 2 is next: approval still needs
to create one pending project and one sent 50% deposit invoice in the existing
transaction. Task 3 notifications and Task 4 seed coverage remain pending.
