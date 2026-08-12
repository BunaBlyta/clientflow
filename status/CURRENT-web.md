# CURRENT — web UI lane (Agent B)

You own `app/(marketing)/`, `app/(dashboard)/`, `app/(auth)/`, `middleware.ts`,
`components/` and `lib/` only. You are the only writer of this file.

Last updated: 2026-08-12 by Codex — four web write flows

## What changed

- Dashboard overview and analytics load live invoices, projects, and requests.
  Clients, notifications, the topbar bell, projects, and project requests also use
  the available API contracts with loading and error states.
- The marketing package request form posts to `POST /api/requests`. It shows a
  success state only after the server confirms creation and preserves entered data
  after an error.
- Settings packages now load from `GET /api/packages`, edit through
  `PATCH /api/packages/[id]`, and create through `POST /api/packages`. The settings
  UI uses the API's major-unit prices and estimated-duration fields, and no longer
  assumes mock-only feature or turnaround fields.
- The new invoice dialog creates draft invoices through `POST /api/invoices`,
  sends the project's currency and major-unit amount, preserves the dialog on
  failure, and adds the server-returned invoice to project detail after success.
- Project detail now posts notes through `POST /api/notes`, appends the returned
  note to the activity feed, and keeps the draft after a failed post.
- The clients table now calls `POST /api/clients/[id]/resend-invitation`, shows a
  sending state, and distinguishes an email-delivery failure from success.
- Extended `lib/fetch-json.ts` to support request options for authenticated write
  calls while retaining its no-store/error handling defaults.

## Verification

- `npm run verify`: typecheck passed, lint passed, and all 57 Vitest tests passed.
  The required Turbopack build was blocked by the sandbox process/port
  restriction.
- `npx next build --webpack`: passed; all 28 routes compiled, including the
  shipped package, notes, invoice, notification, auth-me, and invitation routes.
- Focused typecheck/lint checks passed after each individual task.
- No API, Prisma, mobile, settings team-invite, business-profile, or marketing
  contact-form files were changed.

## Handoff notes

- The staff invite control remains intentionally mock-backed/disabled because
  staff invitations are cut from v1 and have no backend endpoint.
- Settings business profile remains local UI only; no API contract exists for it.
- The topbar and settings profile still use the seeded `currentStaffUser`; the
  shipped `GET /api/auth/me` endpoint can replace that hardcoded identity in a
  later web task.
- The public pricing cards still use their existing package data source. Settings
  writes now reach the database, but a later task may be needed if the marketing
  cards must refresh from the API in the same browser session.

## Hard rule

Never run `npm install`, `prisma migrate`, or `npx expo install` in this lane.
Commit only owned paths and this file; never use `git add -A`.
