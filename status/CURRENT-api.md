# CURRENT — API & database lane (Agent A)

Last updated: 2026-08-12 by Agent A — Flow A notification repair complete

## Completed

- Kept `POST /api/auth/verification/verify` as a read-only code check. It now
  returns the user without activating the account, marking the email verified,
  or clearing the code.
- Extended verification-code lifetime from 10 minutes to 30 minutes so a client
  has a practical window to read the onboarding email.
- Added a route-level test for the real send → verify → set password → login
  sequence. It proves the code survives the check and is consumed only by
  `POST /api/auth/set-password`.
- Approval now creates one readable `PENDING` project and one `SENT` deposit
  invoice for half the selected package price in the same database transaction
  as the client and request changes. The project uses the company name (or
  prospect name) followed by the package name.
- Updated the architecture handoff to describe the approval side effects and
  the read-only verification check.
- Added in-app notifications for new requests to staff, approval to the client,
  invoice issuance to the client, and project stage changes to the client. A
  linked client also gets a rejection notification; a brand-new rejected
  prospect has no account to notify, so rejection does not create one.

## Verification

- `npm run verify`: typecheck, lint, and all 30 tests passed. The normal build
  hit the documented sandbox-only Turbopack port restriction.
- `npx next build --webpack` passed and generated all 27 routes.
- The approval tests use a shared transaction mock and verify the exact project
  and invoice payloads, including the 50% amount and invoice state transition.
  A fresh Neon approval and subsequent client `GET` readback still need to be
  clicked through by Buna.
- Notification tests cover all five events added in this task and verify that
  each notification is written in the same transaction as its state change.

## Handoff

Tasks 1 and 2 are committed and pushed separately. Task 3 is implemented and
ready to commit and push. Task 4 seed coverage remains pending.
