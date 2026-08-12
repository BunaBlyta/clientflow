# CURRENT — API & database lane (Agent A)

Last updated: 2026-08-12 by Agent A — Flow A repair tasks complete

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
- Added a fourth seeded client with a `PENDING` Full Website project and a
  `SENT` $3,250 deposit invoice, plus an unread `REQUEST_SUBMITTED` notification
  for the seeded staff user. Existing seeded clients and their project counts
  were left unchanged.

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
- Seed code typechecks as part of the repository gate. The shared Neon database
  was not reseeded by this agent because the seed resets demo states; Buna should
  run the existing seed command when ready to refresh demo data.

## Handoff

Tasks 1, 2, and 3 are committed and pushed separately. Task 4 is implemented and
ready to commit and push. After this commit, the API brief is complete; the next
step is Buna's live Flow A click-through and Neon readback.
