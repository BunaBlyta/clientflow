# CURRENT — backend lane

**Owner: Codex CLI. You are the only writer of this file. Overwrite it before you
stop. Do not edit the other CURRENT-*.md files.**

Last updated: 2026-08-11 by Codex

## State

- **Database is LIVE.** Migration `20260811061812_init_schema` ran against Neon on
  11 Aug. All 9 tables and 6 enums exist, and the migration is committed.
- **The database is empty.** No seed script has been written.
- **No API routes exist.** `app/api/` is empty. Both frontends still use mock data.
- **No tests exist.** Vitest is installed and configured to pass when no test files
  are present, but the required financial and state-transition tests still need to
  be added before those features ship.
- **Verification checkpoint:** typecheck passed; lint passed with two existing
  unused-variable warnings in the dashboard projects page; Vitest passed with no
  test files; `next build` failed in the sandbox because Turbopack could not start
  a child process that binds to a port while processing CSS (`Operation not
  permitted`).

## Next, in order

1. **Seed script.** Copy the data shape from `mobile/lib/mock-data.ts`: one client,
   four projects across stages, invoices spanning statuses, notes, and
   notifications.
2. **One thin end-to-end slice:** login and fetch a seeded project. Confirm the
   response shape against the frontend assumptions before adding more routes.
3. **Remaining API routes**, then Stripe with signature verification, idempotency,
   webhook-driven payment state, and focused tests.

## Yours to touch

`prisma/`, `app/api/`, auth logic, Stripe integration, seed script, and this
backend status/log area. Nothing in `components/`, `app/(marketing)`,
`app/(dashboard)`, or `mobile/`.
