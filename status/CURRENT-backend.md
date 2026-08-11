# CURRENT — backend lane

**Owner: Codex CLI. You are the only writer of this file. Overwrite it before you
stop. Do not edit the other CURRENT-*.md files.**

Last updated: 2026-08-11 by Claude (Cowork)

## State

- **Database is LIVE.** Migration `20260811061812_init_schema` ran against Neon on
  11 Aug. All 9 tables (User, Client, Package, ProjectRequest, ContactLead, Project,
  Invoice, Note, Notification) and 6 enums exist. Migration file is committed.
- **The database is empty.** No seed script has been written.
- **No API routes exist.** `app/api/` is empty. This is the project's bottleneck —
  both frontends are on mock data because there is nothing to call.
- **No tests.** AGENTS.md §3 requires tests for anything financial or
  state-machine-shaped: the Stripe webhook, invoice transitions, request approval.
- `prisma.config.ts` had a `directUrl` key Prisma 7 rejects; removed 10 Aug. If
  pooled connections cause trouble during a migration, run that one command with
  `DATABASE_URL="$DIRECT_URL"` rather than re-adding it.

## Next, in order

1. **Seed script.** Copy the data shape from `mobile/lib/mock-data.ts` — it already
   covers one client with 4 projects across stages, 11 invoices spanning every
   invoice status, notes and notifications. An empty dashboard demonstrates nothing.
2. **One thin end-to-end slice:** login → fetch a seeded project. Get this working
   before building more routes, so mismatches between your response shapes and the
   frontend's assumed types surface while they are still cheap to fix.
3. Remaining API routes. Stripe last — it is the one piece with a hard correctness
   requirement (webhook-driven, signature-verified, idempotent).

## Yours to touch

`prisma/`, `app/api/`, auth logic, Stripe integration, the seed script.
Nothing in `components/`, `app/(marketing)`, `app/(dashboard)` or `mobile/`.
