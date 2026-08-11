# CURRENT — backend lane

**Owner: Codex CLI. You are the only writer of this file. Overwrite it before you
stop. Do not edit the other CURRENT-*.md files.**

Last updated: 2026-08-11 by Codex

## State

- **Session signing is hardened.** Production now fails at module load when
  `SESSION_SECRET` is absent. Local development uses an explicitly named
  development-only fallback and logs a warning; the ignored local `.env` now has
  a generated `SESSION_SECRET`. Vercel must set its own secret before deploy.
- **Wrong-key protection is tested.** The new auth test creates a token and
  confirms decoding it with a different secret returns `null`. Scrypt cost
  parameters are explicit and aligned between auth verification and seed data.
- **The thin API slice remains live:** login returns a signed token and cookie;
  the project route accepts cookie or bearer authentication.
- **Verification:** 5 Vitest tests, typecheck, and lint pass. Full `npm run
  verify` still reaches the build but Turbopack fails in this environment while
  binding an internal process during CSS processing (`Operation not permitted`).
  The two existing dashboard lint warnings remain.

## Next, in order

1. Wire one frontend screen to the authenticated routes.
2. Add the remaining API routes for projects, invoices, notes, notifications,
   and requests.
3. Build Stripe integration with signature verification, idempotency,
   webhook-driven payment state, and tests.

## Yours to touch

`prisma/`, `app/api/`, auth logic, Stripe integration, seed script, backend
dependencies, `docs/ARCHITECTURE.md`, and this backend status/log area. Nothing
in `components/`, `app/(marketing)`, `app/(dashboard)`, `lib/`, or `mobile/`.
