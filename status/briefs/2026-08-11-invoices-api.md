# Brief — Agent A (API & database): invoice endpoints

**Written by Buna's Cowork session, 2026-08-11. You are Agent A. You own
`app/api/**`, `prisma/`, `docs/ARCHITECTURE.md` and `status/CURRENT-api.md`.**

Read `AGENTS.md`, then `docs/HANDOVER-2026-08-11.md`, then
`status/CURRENT-api.md` before starting. Trust those over anything you infer
from the code.

**You are first in the chain.** Agents B (web) and C (mobile) are both blocked
on this brief. Commit and push as soon as the routes work — do not hold them
back while you polish.

---

## Why this task

A Stripe payment already writes `PAID` into the database and the webhook is
proven end to end. But there is no `/api/invoices` route, so **no screen on
either platform can show that it happened.** The best-working feature in the
project is currently invisible to a reviewer. That is what this fixes.

## What to build

Two routes, both `runtime = 'nodejs'`, both modelled directly on the existing
`app/api/projects/route.ts` and `app/api/projects/[id]/route.ts`:

1. `GET /api/invoices` — flat array, newest first (`createdAt desc`).
   Accepts an optional `?projectId=` query parameter, the same way
   `/api/notes` already does.
2. `GET /api/invoices/[id]` — a single invoice, or 404.

Auth and scoping follow the existing pattern exactly: `getAuthenticatedUser`,
401 when absent, and `user.role === 'CLIENT'` narrows to
`{ client: { userId: user.id } }`. Staff see everything. A client asking for
another client's invoice must get **404, not 403** — 403 confirms the record
exists.

---

## The response shape — read this part twice

Both frontends already have an `Invoice` type and a full set of components
built against it. **The API adapts to them; they do not adapt to the API.**
That is the same choice `/api/projects` already made, and it keeps this task
inside one lane instead of three. Return exactly:

```ts
{
  id: string;
  projectId: string;
  clientId: string;      // new — see note below
  kind: 'DEPOSIT' | 'FINAL' | 'EXTRA' | 'CUSTOM';
  label: string;
  amountCents: number;
  status: 'DRAFT' | 'SENT' | 'PAYMENT_PENDING' | 'PAID' | 'FAILED' | 'VOIDED' | 'REFUNDED';
  dueDate?: string;      // ISO, omitted when null
  paidAt?: string;       // ISO, omitted when null
  createdAt: string;     // ISO
}
```

Four Prisma-to-frontend mappings, none of them optional:

| Prisma column | Response field | Conversion |
|---|---|---|
| `type` (`InvoiceType`) | `kind` | rename only |
| `description` (`String?`) | `label` (required) | fall back when null — see below |
| `amount` (`Decimal`, **major units**) | `amountCents` | **`Math.round(Number(amount) * 100)`** |
| `clientId` | `clientId` | pass through |

### The one that will silently break everything

`Invoice.amount` is `Decimal(12, 2)` in **dollars** — the seed writes
`'3250.00'`, and `app/api/stripe/checkout/route.ts` already multiplies by 100
before sending to Stripe. Meanwhile `lib/format.ts` has
`formatCurrency(cents)` which **divides by 100**.

Return `amount` unconverted and every invoice in the app renders as `$33`
instead of `$3,250`. It will not throw, it will not fail typecheck, and it
looks plausible enough to miss. Convert in the route, and add a test that
asserts a `'3250.00'` row comes back as `325000`.

### `label` fallback

`description` is nullable in Prisma but every seeded row has one, so a naive
`description!` will pass every test you can run today and break on the first
real invoice. Derive from `kind` when null: `Deposit invoice`, `Final payment`,
`Extra charge`, `Custom invoice`.

### `CUSTOM` needs a decision, not a guess

Prisma's `InvoiceType` has four values; both frontends' `InvoiceKind` unions
have three — `CUSTOM` is missing. Nothing seeds `CUSTOM`, so this is latent,
exactly like the nullable-`packageId` bug in §4 of the handover.

**Return `CUSTOM` honestly. Do not collapse it into `EXTRA`.** Widening the
union is Agent B and C's job in their own `lib/types.ts` files — say so in your
`CURRENT-api.md` handoff so they pick it up. Do not edit their type files
yourself, even though it is a one-word change.

---

## Two seed-data problems to raise with Buna before touching them

`prisma/seed.ts` is yours, but both of these change what a reviewer sees on
screen, so **surface them and wait** rather than deciding alone:

1. **No invoice has a `dueDate`.** The web invoices table has a Due column and
   an "Overdue" status filter. Against live data the column will read `—`
   eleven times and the Overdue filter will return nothing — a reviewer
   clicking it sees what looks like a broken feature. Suggest adding due dates
   to the seed, including two deliberately past-due `SENT` rows.
2. **Only one client is seeded** (`Riverside Coffee Co.`), so all 4 projects
   and all 11 invoices belong to it. The Client column will show the same name
   in every row, and the search box will look like it does nothing.

Both are seed-only changes and low risk, but they are user-visible, which per
`AGENTS.md` means asking first.

---

## Definition of done

- Both routes return correct shapes for staff and for a client account.
- A client cannot read another client's invoice (404, not 403).
- A test asserting the cents conversion, alongside the existing 7.
- `npm run verify` actually run, not assumed. The Turbopack build failure in
  your sandbox is environmental and expected — typecheck, lint and tests must
  pass. Do not try to fix Turbopack.
- Committed with `git add app/api/ prisma/ status/` (**never `-A`** — two other
  agents are working in this same checkout) and **pushed**.
- `status/CURRENT-api.md` overwritten, and a new file in `status/log/`, both in
  plain language. Include what you tried and abandoned, not just what worked.
- Your `CURRENT-api.md` must state the exact response shape you shipped, since
  B and C are coding against it.

## Do not

- Do not touch `lib/`, `components/`, `app/(dashboard)/`, `app/(auth)/`,
  `app/(marketing)/` or `mobile/`.
- Do not run `npm install`, `npx expo install`, or `prisma migrate`. Print the
  command and stop — those are Buna's alone. No migration should be needed
  here; every column already exists.
- Do not create a git worktree or branch. One checkout, `main`, everyone.
- Do not swap the hand-rolled Stripe `fetch` calls for the official SDK.
