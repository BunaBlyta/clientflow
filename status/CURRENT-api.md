# CURRENT — API & database lane (Agent A)

Last updated: 2026-08-13 00:30 by Codex — staff invitation endpoints

## Completed

- Added staff-only `GET /api/staff`, returning staff users newest first with safe
  identity/status fields and no password, verification-code, reset-token, or
  invitation fields.
- Added staff-only `POST /api/staff/invite`. It validates and normalizes the
  submitted name/email, refuses any existing user email with 409, creates an
  inactive `STAFF` user, and sends the existing verification-code email.
- Added staff-only `POST /api/staff/[id]/resend-invitation`, which looks up a
  `User` directly while requiring `role: STAFF` and returns the same emailSent
  response shape as client invitation resend.
- Email delivery failures are logged and returned as `emailSent: false` without
  undoing a newly created user.
- Added route tests covering authentication, authorization, validation, duplicate
  emails, successful listing/invites/resends, missing staff users, and email
  failures. Updated the SPEC and API contract documentation to reflect that
  teammate invitations are built while register and forgot-password remain cut.

## Verification

- `npm run verify`: typecheck, lint, and all 87 Vitest tests passed. The standard
  Turbopack build is blocked in this Codex sandbox by its documented process/port
  binding restriction while processing the other lane's `app/globals.css`.
- `npx next build --webpack`: passed; the new `/api/staff` and
  `/api/staff/[id]/resend-invitation` routes compiled successfully.
- `git diff --check`: passed.

## Handoff

- No Prisma schema or migration work is needed. The invitation uses the existing
  verification-code columns and `issueVerificationEmail` helper.
- The web lane has unrelated in-progress settings/accept-invite changes in the
  shared checkout. They were preserved and excluded from this commit.
- Buna should run the usual signed-in browser check of the Settings Team tab once
  the web lane wires it to these endpoints.
