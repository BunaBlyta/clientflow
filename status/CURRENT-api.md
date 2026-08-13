# CURRENT — API & database lane (Agent A)

Last updated: 2026-08-13 08:45 by Codex — custom package workflow

## Completed

- Moved the staff invite POST handler to the actual Next.js route file
  `app/api/staff/invite/route.ts`, which handles `POST /api/staff/invite`.
- Kept `app/api/staff/route.ts` as the staff-only `GET /api/staff` handler and
  removed its duplicate invite POST, so the invite behavior is exposed at one
  endpoint only.
- Split shared staff serialization, selection, validation, and unique-error
  helpers into `app/api/staff/_lib.ts`; the invite implementation lives in
  `app/api/staff/_invite.ts` and is called only by the invite route.
- Moved invite tests to `app/api/staff/invite/route.test.ts`, importing the real
  invite route file. The suite also checks that the route file exists at the
  `/api/staff/invite` directory path.
- Added the public `POST /api/contact-leads` intake route. It validates and
  stores a custom-package inquiry and creates an in-app notification for every
  staff user.
- Added staff-only `GET /api/contact-leads` and
  `POST /api/contact-leads/:id/convert`. Conversion atomically creates or reuses
  the client, creates a package-less pending project, and creates a custom draft
  or sent invoice. New or inactive clients receive the existing verification
  email after the transaction commits.
- Added focused tests for public intake, staff access, conversion, invitation
  email failure, missing inquiries, and staff-email conflicts. No Prisma schema
  or migration change was required.

## Verification

- `npm run test`: 29 test files passed, 101 tests passed.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `git diff --check`: passed.
- `npx next build --webpack`: passed; the new contact-lead routes compiled.

## Handoff

- The custom workflow contract is documented in `docs/ARCHITECTURE.md` and the
  feature is marked built in `docs/SPEC.md`.
- No Prisma schema or migration change was needed. Converted state in the staff
  list is derived from a lead email matching a client record; the conversion
  endpoint returns 409 for staff-email conflicts and concurrent client-creation
  races.
- `POST /api/staff` is no longer exported, preventing a second invite endpoint.
