### 2026-08-13 00:30 — Codex — staff invitation endpoints

Changed:
- Added staff-only list, invite, and resend-invitation API routes.
- Reused the verification-code email helper and kept email delivery failures from
  rolling back user creation.
- Added focused tests for auth, validation, conflicts, successful responses,
  missing users, and failed email delivery.
- Updated `docs/SPEC.md` and `docs/ARCHITECTURE.md` so teammate invitations are
  documented as built while register and forgot-password remain cut.

Tried and abandoned (what didn't work, and why):
- The normal `next build` path was attempted twice through `npm run verify` and
  separately; Turbopack cannot bind its internal process port in this sandbox.
  The Webpack build passed instead.

Left for next session:
- The web Settings Team tab still needs to call the new endpoints and display the
  returned staff list/email status.

Assumptions made (flag if wrong):
- Staff list order is newest first, matching the other dashboard list endpoints.
- Invite creation returns HTTP 201 with `{ user, emailSent }`; resend returns
  HTTP 200 with `{ emailSent }`, matching the existing client resend behavior.

Blockers:
- None in the API lane. The only verification limitation is the sandbox-only
  Turbopack port-binding failure described above.
