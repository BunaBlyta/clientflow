# CURRENT — backend lane

**Owner: Codex CLI. You are the only writer of this file. Overwrite it before you
stop. Do not edit the other CURRENT-*.md files.**

Last updated: 2026-08-11 by Codex

## State

- **Database is LIVE and seeded.** The new migration
  `20260811084529_add_project_target_launch_date` is applied to Neon. The seed
  now gives all four projects sensible target launch dates: three future dates
  and 20 Mar 2026 for the launched project.
- **The thin API slice exists:** `POST /api/auth/login` accepts email/password,
  returns the user plus a signed stateless token, and sets the same token as an
  HTTP-only cookie. `GET /api/projects/:id` accepts either that cookie or a
  bearer token, authorizes the user, and returns a flat project shape.
- **Real verification completed:** login succeeded with
  `sam@clientflow.studio` / `clientflow-demo`, and an authenticated request for
  `proj-1` returned the seeded project JSON with its target launch date.
- **Verification:** typecheck, lint, and the 4 Vitest tests pass. `npm run verify`
  reaches the build, but Next/Turbopack fails in this environment while trying
  to bind an internal process during CSS processing (`Operation not permitted`).
  The two existing dashboard lint warnings remain.

## Next, in order

1. Wire one frontend screen to these real routes and reconcile its nullable
   `packageId` type in the frontend lane.
2. Add the remaining API routes for projects, invoices, notes, notifications,
   and requests.
3. Build Stripe integration with signature verification, idempotency,
   webhook-driven payment state, and tests.

## Yours to touch

`prisma/`, `app/api/`, auth logic, Stripe integration, seed script, backend
dependencies, `docs/ARCHITECTURE.md`, and this backend status/log area. Nothing
in `components/`, `app/(marketing)`, `app/(dashboard)`, `lib/`, or `mobile/`.
