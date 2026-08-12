### 2026-08-13 00:34 — Codex — live Team tab and accept-invite page

Changed:
- Replaced the Settings Team fixture with live staff loading, signed-in-user lookup,
  invitations, inactive Invited badges, and verification-email resend actions.
- Added the public `/accept-invite` page. It prefills `?email=`, submits the six-digit
  code and password to the existing set-password route, and redirects to the dashboard.
- Kept `/accept-invite` outside the middleware matcher so a new invitee is not sent
  into the login redirect loop.
- Removed the unused store actions and hardcoded identity references that only backed
  the old Team mock.

Tried and abandoned (what didn't work, and why):
- The normal Turbopack build failed on the sandbox's process/port permission while
  processing CSS. The webpack build completed successfully instead.
- A browser click-through could not be performed because no in-app browser was
  available in this session.

Left for next session:
- Buna should click through the invitation email flow and verify the new staff user
  can set a password and land on `/dashboard` against the shared Neon data.

Assumptions made (flag if wrong):
- The staff API contract uses `{ name, email }` for invites and
  `/api/staff/:id/resend-invitation` for inactive staff, matching the API lane's
  documented routes.

Blockers:
- No code blocker. Browser availability is the only unperformed verification.
