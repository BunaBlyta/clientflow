### 2026-08-12 09:15 — API agent — Flow A verification repair

Changed:
- Made the verification-code endpoint check a code without changing the user.
- Extended the email-code lifetime to 30 minutes.
- Added a test that sends a code, checks it, sets a password with the same code,
  and logs in successfully.
- Updated the API lane handoff with the verification result and next task.

Tried and abandoned (what didn't work, and why):
- The normal `next build` command could not start Turbopack in the sandbox because
  it is not allowed to bind its internal port. The prescribed webpack build
  completed successfully instead.

Left for next session:
- Task 2: make request approval create exactly one pending project and one sent
  50% deposit invoice.
- Tasks 3 and 4: add missing notifications and seed coverage.

Assumptions made (flag if wrong):
- `/api/auth/verification/verify` should return the stored user details as a
  read-only confirmation; `set-password` remains the only endpoint that consumes
  the code.

Blockers:
- None for Task 1.
