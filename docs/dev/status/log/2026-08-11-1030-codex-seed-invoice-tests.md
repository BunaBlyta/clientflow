### 2026-08-11 10:30 — Codex — seed database and invoice tests

Changed:
- Added a rerunnable Prisma seed covering the mobile fixture shape: demo staff
  and client users, packages, projects, invoices, notes, notifications, and
  project requests.
- Added Prisma's PostgreSQL adapter, `pg`, `tsx`, and the PostgreSQL type package
  required to execute the TypeScript seed against Neon.
- Added invoice transition rules and four Vitest tests for payment lifecycle
  behavior, failed-payment retry, terminal states, and invalid transitions.
- Ran the seed successfully against Neon.

Tried and abandoned (what didn't work, and why):
- The first full `npm run verify` after the task stopped at typecheck because
  frontend-owned `lib/store.ts` currently expects `packages`, `inviteStaff`, and
  `updatePackage` fields that are not present in the shared store. The backend
  files were not changed to work around this frontend mismatch.

Left for next session:
- Build the first real login and seeded-project API slice.
- Re-run full verification after the frontend store edits are reconciled.

Assumptions made (flag if wrong):
- Seed prices convert the mobile fixture's cents into the Prisma schema's decimal
  dollar amounts, e.g. 250000 cents becomes 2500.00.
- The demo staff password is `clientflow-demo`; the client password remains the
  mobile fixture's `riverside123`.

Blockers:
- Full repository verification is blocked by unrelated uncommitted frontend
  changes in `lib/analytics.ts` and `lib/store.ts`.
