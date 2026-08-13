# CURRENT — API & database lane (Agent A)

Last updated: 2026-08-13 08:28 by Codex — fix staff invite route mapping

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

## Verification

- `npm run test`: 27 test files passed, 93 tests passed.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `git diff --check`: passed.

## Handoff

- No Prisma schema, migration, install, web, mobile, or architecture-contract
  changes were needed. The documented API contract already named
  `POST /api/staff/invite`; this change makes the filesystem route match it.
- `POST /api/staff` is no longer exported, preventing a second invite endpoint.
