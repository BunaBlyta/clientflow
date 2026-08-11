# CURRENT — backend lane

**Owner: Codex CLI. You are the only writer of this file. Overwrite it before you
stop. Do not edit the other CURRENT-*.md files.**

Last updated: 2026-08-11 by Codex

## State

- **Database is LIVE and seeded.** The existing migration is applied to Neon, and
  the seed has populated 3 packages, 4 projects, 11 invoices, 13 notes, 7
  notifications, and 3 project requests.
- **Seed script is rerunnable.** It uses stable fixture IDs and upserts, so it
  refreshes the demo records without deleting unrelated records. Demo credentials
  are `jordan@riversidecoffee.com` / `riverside123` for the client and
  `sam@clientflow.studio` / `clientflow-demo` for staff.
- **Invoice transition tests now exist.** Four Vitest tests cover the normal
  lifecycle, failed-payment retry, terminal states, and invalid transitions.
- **No API routes exist yet.** Both frontends still use mock data.
- **Verification:** the backend checks passed independently: typecheck, 4 Vitest
  tests, lint, and Prisma validation. Full `npm run verify` is currently blocked
  by unrelated frontend edits in `lib/store.ts`, which do not typecheck against
  the current frontend state. The existing two dashboard lint warnings remain.

## Next, in order

1. **Thin end-to-end slice:** implement login and fetch a seeded project, then
   confirm its response shape against the frontend assumptions.
2. **Remaining API routes** for projects, invoices, notes, notifications, and
   requests.
3. **Stripe integration** with signature verification, idempotency,
   webhook-driven payment state, and tests using the invoice transition helper.

## Yours to touch

`prisma/`, `app/api/`, auth logic, Stripe integration, seed script, backend
dependencies, and this backend status/log area. Nothing in `components/`,
`app/(marketing)`, `app/(dashboard)`, `lib/`, or `mobile/`.
