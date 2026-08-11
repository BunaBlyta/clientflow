### 2026-08-11 17:03 — Agent A — client onboarding API

Changed:
- Added the public project-request creation endpoint with active-package
  validation.
- Added staff approval and rejection. Approval creates or reuses the account
  and client in one transaction, then sends verification email afterward so an
  email failure cannot undo the approval.
- Added password setup with server-side verification-code validation and the
  same session response as login.
- Preserved the generic success response for unknown verification emails.
- Added 10 focused tests, updated the API contract documentation, and ran the
  real approval flow for `bunablyta@gmail.com`.

Tried and abandoned (what didn't work, and why):
- The first real-chain run was blocked before execution by the sandbox's IPC
  port restriction in `tsx`; the elevated run succeeded. The normal Turbopack
  build hit the same documented sandbox restriction, so the webpack fallback
  was used and passed.

Left for next session:
- The email was accepted by Resend and delivered to the provided address. The
  six-digit code still needs to be entered to exercise set-password and login
  against the real database.

Assumptions made (flag if wrong):
- An existing user is reused by email; an existing client relation is reused,
  otherwise a client is created for that user. Approval responses use
  `emailSent` to report delivery-attempt success.

Blockers:
- The agent cannot read the recipient mailbox, so the final set-password/login
  step needs the code from `bunablyta@gmail.com`.
