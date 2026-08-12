### 2026-08-13 00:51 — Codex — harden staff invitation flow

Changed:
- Converted concurrent staff invite unique-email races into the documented 409
  response.
- Added configured/fallback accept-invite URL generation to staff invitation and
  resend emails without adding a URL to client verification emails.
- Corrected verification email expiry text to 30 minutes.
- Added focused Prisma-error, URL, and email-content tests.
- Updated the API architecture contract and this lane's handoff.

Tried and abandoned (what didn't work, and why):
- An initial direct import test for the URL helper loaded the real Prisma module
  and failed because the isolated test environment has no `DATABASE_URL`. The
  test now mocks the helper's Prisma/email dependencies; production code is
  unchanged by that test-only adjustment.

Left for next session:
- No API follow-up is required for this invitation hardening task.

Assumptions made (flag if wrong):
- `APP_URL` is the canonical configured app origin, matching Stripe checkout;
  request origin is the safe fallback for local and deployed requests without it.
- The invitation link is included in the plain-text email alongside the code,
  while client verification emails remain unchanged apart from the corrected TTL.

Blockers:
- None.
