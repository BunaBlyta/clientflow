# Brief — Web lane: the remaining dashboard screens off mock data

**Written by Buna's Cowork session, 2026-08-12. You own `app/(dashboard)/`,
`components/`, `lib/` and `status/CURRENT-web.md`. Nothing else.**

Read `AGENTS.md` (design rules §5), then `docs/HANDOVER-2026-08-11.md`, then
`STATUS.md`, `status/CURRENT-web.md` and `status/CURRENT-api.md`.

**Run this after the onboarding-web brief is committed and pushed** — it touches
the same lane.

---

## Why this task

Four dashboard screens still read `lib/mock-data.ts` through the Zustand store.
Analytics is the one that matters most: `docs/SPEC.md` #11 and `AGENTS.md` §6
both require real charts against real data, not static mockups, and it is one of
the first things a reviewer clicks.

**This is smaller than it sounds.** `lib/analytics.ts` already contains every
aggregation — `revenueOverTime`, `revenueByPackage`, `averageTurnaroundByPackage`,
`invoicesByStatus`, `projectsByStage`, `overallAverageTurnaroundDays`,
`outstandingInvoicesTotal`, `overdueInvoicesTotal`, `totalPaidRevenue`. They are
pure functions taking `Invoice[]` and `Project[]`. The chart components exist and
work. **Do not rewrite any of that.** The only thing wrong is where the arrays
come from.

`/dashboard/projects` and `/dashboard/invoices` already do this correctly. Copy
their fetching and loading/error pattern rather than inventing a third one.

## What to convert, in this order

### 1. `/dashboard/analytics`

Replace `useAppStore((s) => s.invoices)` and `s.projects` with the same API reads
the projects and invoices pages use. Everything below that line stays as it is.

### 2. `/dashboard` (home)

Same swap. The stat tiles use the same `lib/analytics.ts` functions.

### 3. `/dashboard/clients`

Read from `GET /api/clients`.

### 4. `/dashboard/notifications`

Read from `GET /api/notifications`. **Marking a notification read is a write, and
no write endpoint exists.** Do not build one and do not fake it — if
`markNotificationRead` can no longer work honestly, disable the control with a
short line saying it is not wired up yet, the same treatment as the note composer
on the project detail page, and flag it in your status file.

## Explicitly out of scope

- **`/dashboard/settings` — leave it alone.** Managing packages and pricing needs
  write endpoints on `/api/packages` that do not exist. It is a separate API task,
  not yours.
- Do not touch `app/(marketing)/`, `app/api/`, `prisma/` or `mobile/`.
- Do not rewrite `lib/analytics.ts` or any chart component. If a chart looks wrong
  with real data, the aggregation is probably right and the data is genuinely
  different from the mock — check before "fixing" it.
- Do not run `npm install` or `prisma migrate`. Do not create worktrees or branches.

## Definition of done

- Every number and chart on `/dashboard/analytics` traces to the database. Verify
  at least two of them by hand against `GET /api/invoices` — total paid revenue
  and outstanding are the easiest to check.
- Empty and loading states handled. Real data will have gaps the mock never had:
  a package with no completed projects, a month with no revenue, a client with no
  projects. **A chart that divides by zero or renders `NaN` is the likely failure
  here** — check turnaround specifically, since `overallAverageTurnaroundDays`
  can return `null`.
- **Actually clicked through in a browser**, signed in as staff
  (`sam@clientflow.studio` / `clientflow-demo`), at both a narrow and a wide
  window. Every serious bug this week was a layout or wiring problem that
  typecheck, lint, the tests and the build all passed.
- Design rules held: Inter 400/500/600, `#5AB2FF` as the only accent, hairline
  borders, 4px grid. Charts keep their existing palette.
- `npm run verify` actually run; `npx next build --webpack` is the fallback.
- Committed with `git add app/ components/ lib/ status/` (never `-A`) and
  **pushed**. If you cannot verify in a browser, commit anyway and say so plainly
  — do not sit on uncommitted work, and do not claim verification you did not do.
- `status/CURRENT-web.md` overwritten and a NEW file in `status/log/`.

## Before writing code

Three lines: current state, what you will change, and anything already stale.
Then wait for confirmation.
