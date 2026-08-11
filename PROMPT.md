# Paste-able prompts

Copy one of these into a fresh agent or chat. Nothing else needed.

---

## The universal one (works for any agent, any lane)

```
Read AGENTS.md, then STATUS.md and the three status/CURRENT-*.md files,
before anything else. They are the source of truth — trust them over
anything you remember or infer from the code.

Then tell me, in three lines: what state the project is in, what you think
the next task is, and anything in those files that looks stale or wrong.
Do not write code until I confirm.

Rules that are not optional:
- Commit at the end of every task. Conventional Commits.
- Before you stop: overwrite your own lane's status/CURRENT-*.md file, and
  create a NEW file in status/log/. Never edit another lane's file, never
  edit STATUS.md, never edit an existing log file. Plain language a
  non-engineer could follow.
- Stay in your lane (AGENTS.md §7 ownership split). Do not touch files
  another agent owns.
- Surface anything touching architecture, the data model, or user-facing
  behaviour instead of guessing.
```

**Why it opens with a question instead of a task:** an agent that has misread the
state will say so in those three lines, and you lose ten seconds. An agent that
starts coding on a misread costs you an evening. That trade is worth it every time.

---

## Backend lane (Codex)

```
Read AGENTS.md, STATUS.md and status/CURRENT-backend.md first.

You own the backend only: prisma/, app/api/, auth, Stripe, and the seed
script. Do not touch frontend files or the mobile app — another agent owns
those and we have lost work to overlap before.

Summarise the current state in three lines and tell me what you think the
next backend task is. Do not write code until I confirm.

Commit at the end of every task. Before you stop, overwrite your own
status/CURRENT-*.md and add a new file in status/log/.
```

## Frontend lane (Claude Code — web)

```
Read AGENTS.md, STATUS.md and status/CURRENT-web.md first.
Design rules are AGENTS.md §5 and they are non-negotiable — Inter, #5AB2FF
as the only UI accent, hairline borders, 4px spacing grid. Not a generic
shadcn-template look.

You own web frontend only: app/(marketing), app/(dashboard), components/,
lib/. Do not touch prisma/, app/api/, or mobile/.

Summarise the current state in three lines and tell me what you think the
next web task is. Do not write code until I confirm.

Commit at the end of every task. Before you stop, overwrite your own
status/CURRENT-*.md and add a new file in status/log/.
```

## Mobile lane

```
Read AGENTS.md, STATUS.md and status/CURRENT-mobile.md first.
Requires Node 22 — run `nvm use 22` before any expo command.

You own mobile/ only. Nothing outside it.

Summarise the current state in three lines and tell me what you think the
next mobile task is. Do not write code until I confirm.

Commit at the end of every task. Before you stop, overwrite your own
status/CURRENT-*.md and add a new file in status/log/.
```

---

## Why this works

`CLAUDE.md` contains one line, `@AGENTS.md`, so Claude Code loads the project rules
automatically. Codex CLI reads `AGENTS.md` natively. The rules were therefore always
being loaded — that was never the problem.

The problem was the other half: `STATUS.md` had grown to over 3,000 words, so agents
skimmed it, missed the current state, and re-derived it badly. It is now split so
that **every file has exactly one writer** — `status/CURRENT-backend.md`,
`CURRENT-web.md` and `CURRENT-mobile.md`, each overwritten only by its own lane,
plus `status/log/` where each entry is a brand-new file. Two agents can never
target the same path, so a conflict is structurally impossible rather than merely
unlikely — the same trick changesets and towncrier use for CHANGELOG files.

## The one rule that matters

Everything above is convenience. This is the part that actually prevents disasters:

> **Commit at the end of every task.**

Uncommitted work is invisible to every other folder and every other agent. On
10 August, roughly 7,800 lines sat uncommitted across four folders — a complete
mobile app and most of the web dashboard — and came close to being lost entirely.
Nothing else in this file matters as much as that one line.
