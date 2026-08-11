# Brief — Web lane: request submission and staff approval

**Written by Buna's Cowork session, 2026-08-11. You own `app/(marketing)/`,
`app/(dashboard)/`, `app/(auth)/`, `middleware.ts`, `app/globals.css`,
`components/`, `lib/` and `status/CURRENT-web.md`. Nothing else.**

Read `AGENTS.md` (design rules §5, non-negotiable), then
`docs/HANDOVER-2026-08-11.md`, then `status/CURRENT-web.md` and
`status/CURRENT-api.md`.

**You are blocked on the API lane.** Read `status/CURRENT-api.md` for the shapes
that actually shipped and code against those, not against this brief, if they
differ.

---

## Why this task

The landing page's project-request form calls `submitProjectRequest` on the
Zustand store. There is no server call — a prospect submits it and nothing is
created, nothing reaches staff. The Requests tab on `/dashboard/projects` reads
mock data and its approve/reject buttons write to the store. Both are facades.

The API lane is adding `POST /api/requests` and `PATCH /api/requests/[id]`.

## What to build

### 1. Landing page request form — make it real

`components/marketing/packages-and-request.tsx` posts to `POST /api/requests`.

While you are in this file: the package cards still read pricing from
`lib/mock-data.ts`. `GET /api/packages` now exists and is public — use it.
SPEC #1 requires the landing page pricing to come from the `Package` table, so
this closes that too.

Handle the failure path visibly. A failed submission must not show a success
state. Success should tell the prospect what happens next — staff reviews it and
they will get an email — rather than just clearing the form.

### 2. Requests tab — real approve/reject

The Requests tab on `/dashboard/projects` reads from the API and its actions
call `PATCH /api/requests/[id]`.

- Derive available actions from the request's current status. An already-decided
  request shows no actions. The server returns 409 for an illegal transition;
  that should be a case you never trigger, not your defence. Show the message if
  it happens anyway.
- **Keep `ConfirmDialog` on reject.** It is irreversible and it notifies a real
  prospect.
- After a successful write, render the server's returned record — never an
  optimistic local guess. This is the mistake that got the invoice row actions
  hidden last week, and the mistake that made the project detail page show
  invoices that did not exist.
- The API may report that the approval succeeded but the invite email failed.
  Surface that distinctly — "approved, but the invite email did not send" is a
  different thing from "approved", and staff needs to know to resend.

### 3. Contact form

`components/marketing/contact-form.tsx` is also store-only. If a `ContactLead`
endpoint exists by the time you get here, wire it. If not, **disable the form
with a short line saying it is not wired up yet** — the same treatment as the
note composer on the project detail page. Do not leave a form that silently
discards what someone typed. Do not build the endpoint yourself.

## Do not

- Do not touch `app/api/`, `prisma/` or `mobile/`.
- Do not run `npm install` or `prisma migrate`.
- Do not create a git worktree or branch.
- Do not convert unrelated screens off mock data. Analytics, settings,
  notifications and the dashboard home are a separate task — leave them.

## Definition of done

- A request submitted from the landing page appears in the staff Requests tab
  after a refresh.
- Approving it moves it out of the pending queue and creates a client;
  rejecting it leaves nothing behind. Both survive a reload.
- **Actually clicked through in a browser**, signed in as staff
  (`sam@clientflow.studio` / `clientflow-demo`). Refresh after every action and
  confirm the database agreed.
- Tested at both a narrow and a wide window. Every serious bug this week was a
  layout or wiring problem that typecheck, lint, the tests and the build all
  passed — including a status dropdown that shipped completely inert.
- Design rules held: Inter 400/500/600, `#5AB2FF` as the only accent, hairline
  borders, 4px grid.
- `npm run verify` actually run; `npx next build --webpack` is the fallback.
- Committed with `git add app/ components/ lib/ status/` (never `-A`) and
  **pushed**. If you cannot verify in a browser, commit anyway and say so
  plainly in the commit message and status file — do not sit on uncommitted
  work, and do not claim verification you did not do.
- `status/CURRENT-web.md` overwritten and a NEW file in `status/log/`.

## Before writing code

Three lines: current state, what you will change, and anything already stale.
Then wait for confirmation.
