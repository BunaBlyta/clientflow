# CURRENT — web UI lane (Agent B)

**You own `app/(marketing)/`, `app/(dashboard)/`, `app/(auth)/`, `middleware.ts`,
`components/` and `lib/` only. You are the only writer of this file. Overwrite it
before you stop. Never edit another lane's CURRENT-*.md.**

Last updated: 2026-08-11 by Codex — live projects list

## Hard rule: you do not run installs

**Never run `npm install` yourself.** Print the command and stop — Buna runs it.
Three agents share this checkout and a concurrent install corrupts the lockfile.

## What exists

- **9 routes, with the Projects tab now live:** `/`, `/dashboard`, `/dashboard/clients`,
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

- `/login` now has a complete staff sign-in form. It posts to the existing
  `/api/auth/login` route, shows submitting and error states, rejects client
  accounts from the staff dashboard, and preserves a safe internal return path.
- `middleware.ts` now protects `/dashboard` and its nested routes. It validates
  the signed, unexpired `clientflow_session` cookie before allowing access,
  redirects signed-out visitors to `/login`, clears stale cookies, and sends
  signed-in visitors away from the login page.
- The Projects tab on `/dashboard/projects` now loads projects from
  `GET /api/projects` and client names from `GET /api/clients`. It has explicit
  loading, API error with retry, empty database, and filtered-no-results states.
  It treats a null `packageId` as “Custom project” and shows live statuses as
  read-only until a status-update API exists.

## The next gap

The web login and dashboard route protection are covered, and the Projects tab
is the first dashboard screen converted to live data. Stop here for Buna's review
before converting another screen. The Requests tab remains on the previous mock
store until its API contract is explicitly wired as a separate step.

## Your job, in dependency order

1. **Login page + `middleware.ts` route protection.** Start here — it depends on
   nothing new; `POST /api/auth/login` already works and sets a cookie.
2. **Convert screens off mock data** as the API lane's routes land. Do one screen
   completely — loading, error and empty states — and show Buna before starting
   the next. The contract has never been exercised inside a real component.
3. **Stripe UI last**, once the webhook side is real.

## Verification for the login task

- `npm run typecheck`: passed.
- `npm run lint`: passed with the two pre-existing unused-import warnings in
  `app/(dashboard)/dashboard/projects/page.tsx`.
- `npm run test`: passed (5 tests).
- `npm run verify`: the typecheck, lint, and test stages pass, but Next 16's
  Turbopack build repeatedly fails in this environment while spawning its CSS
  worker (`Operation not permitted`). The webpack fallback
  (`npx next build --webpack`) passes and generates all 20 pages. Next also
  prints its expected deprecation warning because the project contract still
  requires `middleware.ts`.

## Verification for the live Projects tab

- `npm run typecheck`: passed.
- `npm run lint`: passed with no warnings.
- `npm run test`: passed (7 tests).
- `npm run verify`: typecheck, lint, and tests pass; the Turbopack build repeats
  the environment worker failure (`Operation not permitted`).
- `npx next build --webpack`: passed; all 22 pages generated successfully.

## Known type mismatch to handle

`Project.packageId` is now nullable in the web type and the live Projects tab
renders a clear fallback for custom work. The mobile lane has its own equivalent
type and should be updated separately by Agent C/Buna before mobile consumes the
same live response.

`lib/types.ts` is shared with the mobile lane's equivalent — tell Buna before
changing it.

## Design rules are non-negotiable (AGENTS.md §5)

Inter at 400/500/600 only, `#5AB2FF` as the sole UI accent, hairline borders, 4px
spacing grid, badges and cards used sparingly. Not a default shadcn-template look.

## Yours to touch

`app/(marketing)/`, `app/(dashboard)/`, `app/(auth)/`, `middleware.ts`,
`app/globals.css`, `components/`, `lib/`, and this file. Nothing in `app/api/`,
`prisma/`, or `mobile/`.
