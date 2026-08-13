# CURRENT — API & database lane (Agent A)

Last updated: 2026-08-13 11:10 by Codex — project payment-gate enforcement

## What changed

- `PATCH /api/projects/[id]` now enforces the project payment gate at the API
  boundary. A standard `PENDING` project cannot move manually to any phase until
  its initial `DEPOSIT` invoice is exactly `PAID`; missing, pending, failed,
  voided, and refunded deposits remain blocked with HTTP 409.
- Staff cannot manually set `PENDING → DISCOVERY`, even after payment.
  Discovery remains owned by the verified Stripe webhook.
- Projects already in `DISCOVERY` or a later phase keep their existing manual
  status behavior. Custom projects still use their existing `CUSTOM` invoice
  flow and manual non-Discovery behavior; the standard `DEPOSIT` gate is not
  applied to them.
- Added focused route tests for unpaid transitions to Design and Cancelled,
  manual Discovery rejection, custom-project behavior, later-phase changes, and
  unauthenticated/client authorization responses.
- Documented the status-write rule in `docs/ARCHITECTURE.md`.

## Verification

- `npm run test`: passed — 29 test files, 107 tests.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `git diff --check`: passed.
- `npm run verify`: typecheck, lint, and tests passed; the Turbopack build was
  blocked because the sandbox could not fetch Inter from Google Fonts.
- `npx next build --webpack`: passed; all app and API routes compiled.

## Handoff

- No Prisma schema or migration change was needed.
- The untracked `public/clientflow-logo-mark.png` was pre-existing and was not
  touched or staged.
