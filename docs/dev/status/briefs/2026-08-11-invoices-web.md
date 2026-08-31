# Brief — Agent B (Web UI): live invoices screen

**Written by Buna's Cowork session, 2026-08-11. You are Agent B. You own
`app/(marketing)/`, `app/(dashboard)/`, `app/(auth)/`, `middleware.ts`,
`app/globals.css`, `components/`, `lib/` and `status/CURRENT-web.md`.**

Read `AGENTS.md` (design rules are §5 and non-negotiable), then
`docs/HANDOVER-2026-08-11.md`, then `status/CURRENT-web.md`.

**You are blocked on Agent A.** `GET /api/invoices` does not exist yet. Before
writing anything, check `status/CURRENT-api.md` for the shape Agent A actually
shipped and code against that, not against the shape below, if the two differ.

---

## Why this task

A Stripe payment already writes `PAID` into the database — proven end to end
on 11 August, verified in the database itself. **No screen shows it.** The
strongest thing in the project is invisible. `/dashboard/invoices` is where it
becomes visible.

## What to build

Convert `app/(dashboard)/dashboard/invoices/page.tsx` from the mock Zustand
store to live API data.

**Copy the pattern from `app/(dashboard)/dashboard/projects/page.tsx`**, which
Agent B converted yesterday and Buna has already reviewed. Same structure:
local `useState` for rows plus `isLoading` and `error`, a `useCallback` loader
fired from `useEffect`, not the Zustand store. Do not invent a second approach;
matching the existing one is worth more than improving on it.

Three fetches, because the table shows project and client names the invoice
payload does not carry:

- `GET /api/invoices` → rows
- `GET /api/projects` → project-name lookup
- `GET /api/clients` → client-name lookup

Build lookup maps by id and drop the `getProject` / `getClient` imports from
`lib/mock-data.ts` on this page.

### Four states, all of them explicitly

The projects page already does exactly this — match it:

1. **Loading** — spinner, not a blank table.
2. **API error** — message plus a working Retry button.
3. **Empty database** — no invoices exist at all.
4. **Filtered no results** — invoices exist, but none match the search or
   status filter. This must read differently from state 3; the current page
   collapses both into "No invoices match your filters."

---

## The row actions are the trap in this task

`components/dashboard/invoice-row-actions.tsx` offers **Send invoice**,
**Mark as paid** and **Void invoice**. All three call Zustand actions
(`sendInvoice`, `markInvoicePaid`, `voidInvoice` in `lib/store.ts`) that mutate
local state only. **There are no write endpoints for any of them.**

Left as-is over live data, "Mark as paid" turns a row green, the reviewer
refreshes, and it silently reverts. That is worse than the button not being
there — it reads as a data-integrity bug in the exact feature you are trying to
show off, and it undermines the real Stripe flow standing right next to it.

Follow the precedent the projects page already set — **live statuses render
read-only until a status-update API exists.** Hide the actions menu on this
screen and say so in `CURRENT-web.md` so Buna can decide whether Agent A should
add `PATCH /api/invoices/[id]` with the time that is left.

`CreateInvoiceDialog` has the same problem — it writes to the store, so a
created invoice vanishes on refresh. Same treatment, same note.

## `InvoiceKind` needs one more value

`lib/types.ts` has `InvoiceKind = "DEPOSIT" | "FINAL" | "EXTRA"`. Prisma's
`InvoiceType` also has `CUSTOM`, and Agent A is returning it honestly rather
than folding it into `EXTRA`.

Add `"CUSTOM"` to the union. This will fail typecheck at
`KIND_LABEL` in `components/dashboard/create-invoice-dialog.tsx` — that is the
point; give it a label ("Custom"). Do not silence it with a cast.

**`lib/types.ts` is shared with the mobile lane's equivalent
(`mobile/lib/types.ts`). Tell Buna in your handoff that you changed it** — this
is already flagged in your own `CURRENT-web.md`. Do not edit the mobile file.

## Currency: do not touch `formatCurrency`

`lib/format.ts` takes **cents** and divides by 100. Agent A converts Prisma's
`Decimal` dollars to cents in the route. If amounts render 100× too small, the
bug is Agent A's, in `/api/invoices` — report it, do not compensate for it in
the component. A second conversion in the frontend would cancel the first out
and hide a real bug from everyone.

## Two things that will look broken but are not yours

Both come from the seed and are Agent A's to fix; expect them and do not chase
them:

- **Every `dueDate` is null.** The Due column will read `—` on every row and
  the Overdue filter will match nothing.
- **Only one client is seeded**, so the Client column repeats
  "Riverside Coffee Co." eleven times.

---

## Definition of done

- `/dashboard/invoices` reads entirely from the API, with all four states.
- No import from `lib/mock-data.ts` remains on this page.
- **Actually opened in a browser and clicked through**, signed in as staff.
  Every serious bug this week was found by running the app, and none were
  caught by typecheck, lint or the build — all four were green throughout.
  Check the status filter, the search box, and the loading and error paths
  (stop the dev server to force the error state).
- Design rules held: Inter 400/500/600, `#5AB2FF` as the only accent, hairline
  borders, 4px grid. Not a default shadcn look.
- `npm run verify` actually run. The Turbopack build failure in your sandbox is
  environmental — `npx next build --webpack` is the fallback that works.
- Committed with `git add app/ components/ lib/ status/` (**never `-A`**) and
  **pushed**.
- `status/CURRENT-web.md` overwritten and a new file in `status/log/`, both in
  plain language a non-engineer could follow — including what you tried and
  abandoned, not only what shipped.

## Do not

- Do not touch `app/api/`, `prisma/`, or `mobile/`.
- Do not run `npm install`. Print the command and stop.
- Do not create a git worktree or branch.
- Do not convert a second screen in this task. One screen, completely, then
  stop for Buna's review — that rule is in your own `CURRENT-web.md` and it
  exists because the API contract had never been exercised inside a real
  component until yesterday.
