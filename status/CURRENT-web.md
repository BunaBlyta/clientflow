# CURRENT — web UI lane (Agent B)

You own `app/(marketing)/`, `app/(dashboard)/`, `app/(auth)/`, `middleware.ts`,
`components/` and `lib/` only. You are the only writer of this file.

Last updated: 2026-08-12 by Codex — marketing request submission

## What changed

- `components/marketing/packages-and-request.tsx` now submits the package request
  to the public `POST /api/requests` endpoint using the documented flat contract.
- The form shows a visible success state only after the API returns success. It
  shows server validation or network errors inline and keeps the entered values so
  a failed request is not silently lost or written to the local Zustand store.
- The unsupported phone input was removed from this form so prospects are not
  asked for data that the current API contract cannot persist.

## Verification

- `npm run verify`: typecheck passed, lint passed, and all 39 Vitest tests passed.
  The required Turbopack build was blocked by the sandbox process/port
  restriction.
- `npx next build --webpack`: compiled the app but the final type check failed on
  an unrelated concurrent API-lane change: `app/api/packages/route.ts` exports
  `invalidPackage`, which Next's generated route type rejects. An earlier webpack
  fallback passed before that API edit landed; the final build is not green.
- No API, Prisma, settings, invoice-dialog, note-composer, or mobile files were
  changed.

## Handoff notes

- Pricing cards still use the existing package data source; this task changed the
  request submission path only.
- The notification PATCH route appeared in the API lane while verification was
  running; notification controls remain governed by the API lane's shipped
  contract and are outside this task.
- Settings, invoice creation, and note posting remain untouched pending their
  respective API write contracts.

## Hard rule

Never run `npm install`, `prisma migrate`, or `npx expo install` in this lane.
Commit only owned paths and this file; never use `git add -A`.
