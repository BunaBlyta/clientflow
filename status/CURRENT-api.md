# CURRENT — API & database lane (Agent A)

Last updated: 2026-08-12 by Agent A — current-user endpoint complete

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
- Added staff-only `POST /api/invoices`. It derives the client from the project,
  creates a two-decimal `DRAFT` invoice through the tested state helper, returns
  the existing invoice serializer shape, and notifies the client in the same
  transaction. Caller-supplied client IDs are ignored and paid/payment-pending
  starting states are rejected.
- Added `POST /api/notes` for both roles. It accepts and returns `body`, derives
  the author from the session, always writes a non-system note, blocks clients
  from another client's project with a non-disclosing 404, and notifies only the
  opposite side of the conversation.
- Added `PATCH /api/notifications/[id]`. It scopes lookup to the session user,
  returns 404 for another user's notification, marks unread notifications once,
  and safely returns 200 without another write when already read.
- Added staff-only `POST /api/packages` and `PATCH /api/packages/[id]`. They
  validate major-unit prices, normalize currencies and slugs, return 409 for
  duplicate slugs, and use `isActive: false` for deactivation. Package updates
  touch no project or invoice rows, so historical amounts remain unchanged.
- Added authenticated `GET /api/auth/me`. It returns the current user's id,
  name, email, and role, plus `clientId` for client sessions. Invalid sessions
  receive a bodyless 401 response.

## Handoff

The Flow A repair tasks and endpoints 1–4 are committed and pushed separately.
Endpoint 5 is implemented and ready to commit/push separately. Endpoint 6 is
next: assess whether invitation resend is a safe thin wrapper before Friday.
