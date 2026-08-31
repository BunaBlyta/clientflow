# Brief — Agent A (API & database): status write endpoints

**Written by Buna's Cowork session, 2026-08-11. You are Agent A. You own
`app/api/**`, `prisma/`, `docs/ARCHITECTURE.md` and `status/CURRENT-api.md`.**

Read `AGENTS.md`, then `docs/HANDOVER-2026-08-11.md`, then
`status/CURRENT-api.md`. Your invoice endpoints from earlier today are live and
proven — a real Stripe payment moved inv-5 to `PAID` and it renders on the web
dashboard.

**Agent B is blocked on this.** Commit and push as soon as the endpoints work.

---

## Why this task

"Table actions" is on the required feature list for this project, and **there
are currently no write endpoints in the entire API outside auth and Stripe.**
Every table is read-only. The web invoice row actions were hidden earlier today
because they only mutated local state and reverted on refresh.

## Build exactly two endpoints. No more.

### 1. `PATCH /api/invoices/[id]`

Accepts `{ status }`. **Use `prisma/invoice-state.ts`** — do not write new
transition logic. That file is a tested state machine that currently nothing
imports except its own test; this is what it was written for.

- Reject illegal transitions with **409** and a message naming both states.
- **Staff only.** A `CLIENT` gets 403 — clients pay invoices, they do not
  change their status. This differs from the read endpoints, which scope to the
  client's own records; here the whole operation is staff-only.
- Return the updated invoice in the same shape `serializeInvoice` already
  produces, so Agent B can drop it straight into the table row.

**`PAID` must not be reachable through this endpoint.** The state machine
already blocks every path to it except `PAYMENT_PENDING → PAID`, which the
Stripe webhook owns. Do not add a manual override, and do not "fix" the state
machine to allow one — a confirmed payment being the only route to `PAID` is a
deliberate integrity rule (`AGENTS.md`, and the webhook design). If a staff
member needs to record an offline payment, that is a separate feature and not
in scope this week.

`REFUNDED` is legal from `PAID` in the state machine, but a real refund has to
go through Stripe to move actual money. **Leave refunds out of this endpoint**
and note it in your handoff.

### 2. `PATCH /api/projects/[id]`

Accepts `{ status }` against the `ProjectStatus` enum. Staff only, 403 for
clients.

Write a `SYSTEM` note recording the change, matching the wording the Stripe
webhook already uses when a deposit moves a project to Discovery — look at how
that audit note is written and be consistent with it rather than inventing a
second phrasing. Return the updated project in the `/api/projects` shape.

### Explicitly out of scope

Do not add request approve/reject, invoice creation, client editing, or
anything else. The Requests tab is still on mock data and is a separate task.
Two endpoints, then stop.

---

## Definition of done

- Both endpoints work for staff and return 403 for a client account.
- Illegal invoice transitions return 409, not 500.
- Tests for the transition rules through the endpoint, including that a client
  is refused and that `SENT → PAID` is rejected. The existing suite is 9 tests
  across 4 files.
- `npm run verify` actually run. The Turbopack sandbox failure is environmental
  and expected; the webpack build is the fallback that works.
- Committed with `git add app/api/ prisma/ status/` (**never `-A`**) and
  **pushed**.
- `status/CURRENT-api.md` overwritten and a new file in `status/log/`, plain
  language, including what you tried and abandoned.
- State the exact request and response shapes in `CURRENT-api.md` — Agent B is
  coding against them.

## Do not

- Do not touch `lib/`, `components/`, `app/(dashboard)/`, or `mobile/`.
- Do not run `npm install` or `prisma migrate`. No migration is needed; every
  column exists. Print the command and stop.
- Do not create a git worktree or branch.
- Do not modify `prisma/invoice-state.ts` — use it as written.
