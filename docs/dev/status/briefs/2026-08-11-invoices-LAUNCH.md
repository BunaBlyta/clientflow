# How to launch the invoices task — paste-able prompts

Three briefs, one dependency: **Agent A must land `/api/invoices` before B and C
can finish.** Start A now. Start B and C once A has committed and pushed — or
start them immediately if you want them reading and planning while A works, since
both briefs tell them to check `status/CURRENT-api.md` for the real shape first.

---

## Agent A — API & database (start here)

```
Read AGENTS.md, then docs/HANDOVER-2026-08-11.md, then status/CURRENT-api.md.
Then read your task brief: status/briefs/2026-08-11-invoices-api.md.

Summarise in three lines: the current state, what the brief is asking for, and
anything in those files that looks stale or wrong. Do not write code until I
confirm.

You own app/api/**, prisma/, docs/ARCHITECTURE.md and status/CURRENT-api.md.
Nothing else. Two other agents are working in this same checkout.

Run `npm run verify` from the repo root — actually run it, do not assume it
passes. Commit with `git add app/api/ prisma/ status/` (never -A) and push.
Before you stop, overwrite status/CURRENT-api.md and add a NEW file in
status/log/, in plain language a non-engineer could follow.

Do not run npm install or prisma migrate — print the command and stop.
Do not create git worktrees or branches. Work on main in clientflow/.
```

## Agent B — Web UI

```
Read AGENTS.md (design rules are §5 and non-negotiable), then
docs/HANDOVER-2026-08-11.md, then status/CURRENT-web.md.
Then read your task brief: status/briefs/2026-08-11-invoices-web.md.

You are blocked on Agent A's /api/invoices route. Read status/CURRENT-api.md
for the shape that actually shipped and code against that.

Summarise in three lines: current state, what the brief asks, and anything
stale. Do not write code until I confirm.

You own app/(marketing)/, app/(dashboard)/, app/(auth)/, middleware.ts,
app/globals.css, components/ and lib/. Not app/api/, not prisma/, not mobile/.

Run `npm run verify`, then open the app in a browser and click through it —
every serious bug this week was invisible to typecheck, lint and the build.
Commit with `git add app/ components/ lib/ status/` (never -A) and push.
Overwrite status/CURRENT-web.md and add a NEW file in status/log/.

Do not run npm install. Do not create git worktrees or branches.
```

## Agent C — Mobile

```
Read AGENTS.md, then docs/HANDOVER-2026-08-11.md, then status/CURRENT-mobile.md.
Then read your task brief: status/briefs/2026-08-11-invoices-mobile.md.

Requires Node 22 — run `nvm use 22` before any expo command.

You are blocked on Agent A's /api/invoices route. Read status/CURRENT-api.md
for the shape that actually shipped.

Summarise in three lines: current state, what the brief asks, and anything
stale. Do not write code until I confirm.

You own mobile/ only. Nothing outside it.

Run `npx tsc --noEmit` from inside mobile/, AND actually run the app —
`npx expo start --web` is enough and needs no Xcode. Nobody has ever run this
app; it is the largest untested area in the project.
Commit with `git add mobile/ status/` (never -A) and push.
Overwrite status/CURRENT-mobile.md and add a NEW file in status/log/.

Do not run npm install or npx expo install. expo-linking is already installed
and is all you need. Do not create git worktrees.
```

---

## What to check when they come back

- **Amounts.** Prisma stores dollars, the frontends expect cents. If any invoice
  renders 100× too small, `/api/invoices` skipped the conversion. This is the
  single most likely bug in the whole task and it fails silently.
- **"Mark as paid" on web.** If that menu is still clickable, it mutates local
  state only and reverts on refresh — worse than absent during a demo.
- **Mobile checkout.** It should open a real Stripe URL, not a `setTimeout`.
- **Everything committed and pushed** before you close a terminal.
- Run `npx prisma db seed` for a clean slate before demoing — it is rerunnable
  and resets invoice statuses.
