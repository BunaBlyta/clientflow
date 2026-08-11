# Brief — Agent B (Web UI): real table actions

**Written by Buna's Cowork session, 2026-08-11. You are Agent B. You own
`app/(marketing)/`, `app/(dashboard)/`, `app/(auth)/`, `middleware.ts`,
`app/globals.css`, `components/`, `lib/` and `status/CURRENT-web.md`.**

Read `AGENTS.md` (design rules §5, non-negotiable), then
`docs/HANDOVER-2026-08-11.md`, then `status/CURRENT-web.md`.

**You are blocked on Agent A.** Read `status/CURRENT-api.md` for the shapes that
actually shipped and code against those, not against this brief, if they differ.

---

## Why this task

You hid the invoice row actions earlier today, correctly — they mutated Zustand
and reverted on refresh. Agent A is now adding the write endpoints, so they can
come back for real. "Table actions" is on the required feature list for this
project and nothing in the app currently has any.

## What to build

### 1. Invoice row actions — restore, against the API

Bring back `components/dashboard/invoice-row-actions.tsx` on
`/dashboard/invoices`, calling `PATCH /api/invoices/[id]`.

**Two actions only: Send invoice and Void invoice.**

**Delete "Mark as paid" entirely** — do not hide it, remove it. The server state
machine (`prisma/invoice-state.ts`) makes every path to `PAID` illegal except
`PAYMENT_PENDING → PAID`, which the Stripe webhook owns. A confirmed payment is
the only way an invoice becomes paid. That is a deliberate integrity rule, not
an oversight, and the button cannot work.

Derive which actions are available from the invoice's current status rather
than hardcoding — the server will return **409** for an illegal transition, and
that should be a case you never trigger, not your primary defence. Show the 409
message if it happens anyway.

Keep the existing `ConfirmDialog` on Void. It is destructive and irreversible in
the state machine.

### 2. Project status — make it editable

`/dashboard/projects` currently renders live statuses as read-only, with a note
in your own CURRENT file saying that stands "until a status-update API exists."
It now exists. Wire status changes to `PATCH /api/projects/[id]`.

### 3. The part that is easy to get wrong

After a successful write, **the row must reflect the server's response**, not an
optimistic local guess. Use the updated record the endpoint returns. This is the
whole reason the actions were hidden this morning: a UI that shows a state the
database does not hold is worse than no action at all.

Handle the failure path visibly — a failed PATCH must not leave the row looking
changed. `sonner` toasts are already wired in the root layout and
`invoice-row-actions.tsx` already imports `toast`.

### Explicitly out of scope

Do not convert another screen off mock data. Do not touch the Requests tab, the
create-invoice dialog, or settings. Two tables, real actions, then stop.

---

## Definition of done

- Send and Void work on `/dashboard/invoices` and survive a page refresh.
- Project status changes work on `/dashboard/projects` and survive a refresh.
- **Actually clicked through in a browser**, signed in as staff
  (`sam@clientflow.studio` / `clientflow-demo`). Refresh after every action and
  confirm the database agreed. Every serious bug this week was invisible to
  typecheck, lint and the build — including a tab bar that rendered as a broken
  vertical stack for days.
- Design rules held: Inter 400/500/600, `#5AB2FF` as the only accent, hairline
  borders, 4px grid.
- `npm run verify` actually run. Turbopack fails in the sandbox for
  environmental reasons; `npx next build --webpack` is the fallback.
- Committed with `git add app/ components/ lib/ status/` (**never `-A`**) and
  **pushed**.
- `status/CURRENT-web.md` overwritten and a new file in `status/log/`, plain
  language, including what you tried and abandoned.

## Do not

- Do not touch `app/api/`, `prisma/`, or `mobile/`.
- Do not run `npm install`. Print the command and stop.
- Do not create a git worktree or branch.
- Do not re-add "Mark as paid" in any form.
