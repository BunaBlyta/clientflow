# STATUS.md

**Project-wide facts. Buna owns this file — agents should not overwrite it.**
Agents: write your lane's `status/CURRENT-*.md` instead, and add a log entry.

**Deadline:** Friday 2026-08-14 · **Last updated:** 2026-08-11

## Where state lives

| File | Who writes it |
|---|---|
| `STATUS.md` (this file) | Buna |
| `status/CURRENT-backend.md` | Codex CLI only |
| `status/CURRENT-web.md` | web agent only |
| `status/CURRENT-mobile.md` | mobile agent only |
| `status/log/<date>-<time>-<agent>-<task>.md` | whoever did the task — a **new** file each time, never edited afterwards |

Every file has exactly one writer, so two agents can never collide on the same
path. This replaced a single shared STATUS.md that had grown past 3,000 words and
was being skimmed rather than read.

**To understand the project state:** read this file, then the three
`CURRENT-*.md` files. That is the whole picture. The `log/` folder is history —
read it only when you need the *why* behind a decision.

## One-line status per lane

- **Backend** — database live, 9 tables, **empty and no seed script, no API routes.**
  This is the bottleneck.
- **Web** — 5 routes built, all on mock data. Missing detail page, settings,
  notifications, Stripe.
- **Mobile** — feature-complete on mock data, **never run on a simulator.**

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
