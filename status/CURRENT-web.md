# CURRENT — web UI lane (Agent B)

**You own `app/(marketing)/`, `app/(dashboard)/`, `app/(auth)/`, `middleware.ts`,
`components/` and `lib/` only. You are the only writer of this file. Overwrite it
before you stop. Never edit another lane's CURRENT-*.md.**

Last updated: 2026-08-11 by Claude (Cowork) — lane setup

## Hard rule: you do not run installs

**Never run `npm install` yourself.** Print the command and stop — Buna runs it.
Three agents share this checkout and a concurrent install corrupts the lockfile.

## What exists

- **9 routes, every one on mock data:** `/`, `/dashboard`, `/dashboard/clients`,
  `/dashboard/projects`, `/dashboard/projects/[id]`, `/dashboard/invoices`,
  `/dashboard/analytics`, `/dashboard/notifications`, `/dashboard/settings`.
- Data comes from `lib/mock-data.ts` through a Zustand store in `lib/store.ts`.
  Packages are genuinely editable in Settings and flow through to the public
  pricing page.
- Verified 11 Aug: 0 type errors, 0 lint errors, `next build` succeeds. Two
  pre-existing unused-var warnings in `dashboard/projects/page.tsx` are left
  deliberately — they look like the start of unfinished work.
- A real bug was fixed yesterday: `app/globals.css` defined `data-horizontal`/
  `data-vertical` variants matching a bare boolean attribute, but Base UI only
  emits `data-orientation="horizontal"|"vertical"`. Every tab bar in the app was
  rendering as a broken vertical stack. Fixed by matching on the value.

## The gap nobody flagged for two days

**There is no login page on web, and `/dashboard` is publicly reachable.** No
`middleware.ts`, no auth check anywhere. Anyone can open the dashboard and see
everything. "Auth with email verification codes" is on the required feature list
and the web side of it is at zero.

## Your job, in dependency order

1. **Login page + `middleware.ts` route protection.** Start here — it depends on
   nothing new; `POST /api/auth/login` already works and sets a cookie.
2. **Convert screens off mock data** as the API lane's routes land. Do one screen
   completely — loading, error and empty states — and show Buna before starting
   the next. The contract has never been exercised inside a real component.
3. **Stripe UI last**, once the webhook side is real.

## Known type mismatch to handle

`Project.packageId` is nullable in the database but typed as required in
`lib/types.ts`. Prisma is correct (AGENTS.md §4 — custom projects have no
package). The type needs `string | null` and the UI needs a fallback;
`getPackage(project.packageId)` is called in at least two places. All four seeded
projects happen to have a package, so this has not broken yet.

`lib/types.ts` is shared with the mobile lane's equivalent — tell Buna before
changing it.

## Design rules are non-negotiable (AGENTS.md §5)

Inter at 400/500/600 only, `#5AB2FF` as the sole UI accent, hairline borders, 4px
spacing grid, badges and cards used sparingly. Not a default shadcn-template look.

## Yours to touch

`app/(marketing)/`, `app/(dashboard)/`, `app/(auth)/`, `middleware.ts`,
`app/globals.css`, `components/`, `lib/`, and this file. Nothing in `app/api/`,
`prisma/`, or `mobile/`.
