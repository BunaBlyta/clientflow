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

- **API** — essentially complete. 11 routes, seeded Neon database, auth,
  verification codes, Stripe checkout + webhook **proven end to end on 11 Aug**
  (verified in the database, not just in the logs). 7 tests across 3 files.
- **Web** — 9 routes built. Login and `/dashboard` route protection work.
  Only `/dashboard/projects` reads live data; **the other 7 dashboard screens
  are still on `lib/mock-data.ts`.**
- **Mobile** — project list and detail read live data. Notes, invoices,
  notifications, verification codes and checkout are still fixtures, and
  checkout is a fake `setTimeout`. **Never run on a simulator or a device** —
  the largest untested area in the project.

**The gap that matters:** the backend is no longer the bottleneck; the
frontends still showing fake data are. A reviewer notices that first.

## In flight — invoices, both platforms (started 11 Aug)

Briefs are in `status/briefs/2026-08-11-invoices-*.md`; start from the
`LAUNCH` one. Agent A adds `/api/invoices`, then B and C wire the screens.

Picked because a Stripe payment already writes `PAID` to the database and **no
screen anywhere shows it** — the best-working feature is currently invisible.

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
