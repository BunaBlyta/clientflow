# CURRENT — API & database lane (Agent A)

Last updated: 2026-08-13 00:51 by Codex — harden staff invitation flow

## Completed

- Staff invites now catch a Prisma `P2002` unique-email error from the actual
  create operation, so concurrent invites return the existing 409 conflict
  response instead of an unhandled error.
- Staff invite creation and resend now generate an `/accept-invite?email=...`
  URL. The origin uses `APP_URL` when configured and the incoming request origin
  as the fallback, with no hardcoded production domain.
- Client verification emails remain code-only because only staff invitation calls
  provide the optional invite URL.
- Corrected verification email copy from 10 minutes to the actual 30-minute code
  lifetime.
- Added focused tests for the unique-constraint race, configured/fallback URL
  generation, staff email content, and preserving client email behavior.
- Updated `docs/ARCHITECTURE.md` with the race-safety and email URL contract.

## Verification

- `npm run test`: 26 test files passed, 92 tests passed.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `git diff --check`: passed.

## Handoff

- No Prisma schema, migration, install, web, or mobile files were changed.
- Staff invitation emails rely on the existing `APP_URL` convention used by the
  Stripe checkout route; if it is absent, Vercel/local request origin is used.
