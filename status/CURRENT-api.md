# CURRENT — API & database lane (Agent A)

Last updated: 2026-08-13 13:30 by Codex — staff detail read contracts

## What changed

- Added `GET /api/clients/:id`, returning the client contact record together
  with all of that client's projects and invoices. Client sessions are limited
  to their own record; staff can read any client.
- Added staff-only `GET /api/requests/:id`, returning request details, the
  package, the linked client after approval, and that client's projects.
- Added staff-only `GET /api/contact-leads/:id`, returning inquiry details, any
  existing client with the same email as context, and that client's projects.
- Added focused tests for the new detail endpoints, authentication,
  authorization, client isolation, missing records, and serialized linked
  project/invoice data.
- Documented the new contracts in `docs/ARCHITECTURE.md`.

## Important remaining product issue

- Approval and custom conversion already create real projects, so accepted work
  is available from `GET /api/projects`.
- The web lane still needs to make request/inquiry/client rows navigable and
  filter active queues versus history.
- The custom inquiry list still derives `clientId` from an email match. That is
  not a reliable per-inquiry conversion state: an existing client may submit a
  new inquiry. The correct fix is a persisted `ContactLead → Project` link (a
  genuine schema change), followed by a migration and generated-client refresh
  performed by Buna. No heuristic was introduced here.

## Verification

- `npm run test`: passed — 32 test files, 131 tests.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `git diff --check`: passed.
- `npx next build --webpack`: passed; all app and API routes compiled.

## Handoff

- No Prisma schema or migration change was made in this task.
- Web should consume the new detail endpoints for clickable request, inquiry,
  and client views. The custom inquiry action must distinguish an existing
  client match from this inquiry having actually been converted.
- The untracked `public/clientflow-logo-mark.png` was pre-existing and was not
  touched or staged.
