# STATUS.md

**Project-wide facts. Buna owns this file — agents should not overwrite it.**
Agents: write your lane's `status/CURRENT-*.md` instead, and add a log entry.

**Deadline:** Friday 2026-08-14 · **Last updated:** 2026-08-11

## Where state lives

| File | Who writes it |
|---|---|
| `STATUS.md` (this file) | Buna |
| `status/CURRENT-api.md` | Codex CLI only |
| `status/CURRENT-web.md` | web agent only |
| `status/CURRENT-mobile.md` | mobile agent only |
| `status/log/<date>-<time>-<agent>-<task>.md` | whoever did the task — a **new** file each time, never edited afterwards |
| `status/briefs/<date>-<task>-<lane>.md` | Buna — task instructions handed *to* an agent, read-only for the agent |

Every file has exactly one writer, so two agents can never collide on the same
path. This replaced a single shared STATUS.md that had grown past 3,000 words and
was being skimmed rather than read.

**To understand the project state:** read this file, then
`docs/HANDOVER-2026-08-11.md`, then the three `CURRENT-*.md` files. That is the
whole picture. The `log/` folder is history — read it only when you need the
*why* behind a decision.

The handover is the one to read if you are new to the project or picking it back
up after a break: it covers the reasoning behind the current setup and the
things that are easy to get wrong, which this file deliberately does not repeat.

## One-line status per lane

- **API** — 14 routes, seeded Neon database, auth, verification codes, Stripe
  checkout + webhook. 19 tests. Staff write endpoints exist for invoice and
  project status (`PATCH /api/invoices/[id]`, `PATCH /api/projects/[id]`), plus
  a public `GET /api/packages`.
- **Web** — 12 page routes. Login and `/dashboard` protection work.
  `/dashboard/projects`, `/dashboard/invoices` and `/dashboard/projects/[id]`
  read live data. Still on `lib/mock-data.ts`: dashboard home, analytics,
  clients, notifications, settings, and both marketing components
  (`packages-and-request.tsx`, `contact-form.tsx`).
- **Mobile** — login, projects and the full invoice + checkout flow read live
  data. Notes, notifications and verification codes are still fixtures. Runs
  under `expo start --web`; **still never run on a simulator or a device.**

## The payment loop works, end to end (11 Aug)

A real Stripe test payment made from the mobile app moved inv-5 to `PAID` via
the webhook, and it shows as Paid on the web staff dashboard. Client pays on
mobile → staff sees it on web → the database connects them. Nothing in that
chain is mocked. **This is the demo.**

## Missing against the assignment

- **Table actions** — send/void invoice and project status changes are done and
  verified in a browser. Request approve/reject and resend-invitation are not.
- **Email verification codes** — endpoints work, nothing calls them.
- **Mock data** — five dashboard screens and the marketing pricing still don't
  read the database. Analytics matters most: SPEC #11 requires real charts, not
  static mockups. The marketing pricing is the cheapest, since
  `GET /api/packages` now exists.

## Done — table actions (11 Aug)

`PATCH /api/invoices/[id]` and `PATCH /api/projects/[id]` ship with the row
actions wired to them. Verified by clicking through the signed-in dashboard and
refreshing after each action, not by the test suite.

`prisma/invoice-state.ts` makes `PAID` unreachable except from
`PAYMENT_PENDING`, which the Stripe webhook owns, so **"Mark as paid" cannot
exist as a manual action.** It was deleted from the UI, not hidden. Deliberate,
not a gap.

**What the automated checks missed, both caught only by clicking:** the project
status dropdown shipped completely inert, and the project detail page rendered
mock invoices whose IDs collided with real ones — so a row action there would
have PATCHed a different, real invoice. Typecheck, lint, 19 tests and the build
passed in both cases.

## The rule that matters

On 10 August, roughly 7,800 lines — a complete mobile app and most of the web
dashboard — sat uncommitted across four folders and came close to being lost
entirely. The cause was agents finishing work without committing, so no other lane
or session could see it.

> **Commit at the end of every task. No exceptions.**

If a task is finished and not committed, it is not finished.

## Log entry template

Create a new file at `status/log/YYYY-MM-DD-HHMM-agent-task.md`:

```
### YYYY-MM-DD HH:MM — <agent> — <task name>

Changed:
- ...
Tried and abandoned (what didn't work, and why):
- ...
Left for next session:
- ...
Assumptions made (flag if wrong):
- ...
Blockers:
- ...
```

Write it in plain language a non-engineer could follow — see AGENTS.md §7.
"Tried and abandoned" matters as much as "Changed": if an approach was tried and
dropped, say so and say why, so nobody re-tries the same dead end and so there is
an honest record of the problem-solving, not just the polished result.
