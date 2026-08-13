# CURRENT — web UI lane (Agent B)

Last updated: 2026-08-13 15:35 by Codex — notification loading diagnosis

## What changed

- Reproduced the notification loading path against the running Next server and inspected both web consumers: `/dashboard/notifications` and the topbar dropdown.
- Both surfaces use `fetchJson<Notification[]>("/api/notifications", ...)`, retain their loading/error/retry states, and do not render notification links until the response resolves. The target-ID destination helper is not reached when the API request fails.
- The live server log shows the authenticated notification request fails inside Prisma with:
  `PrismaClientValidationError: Unknown field projectId for select statement on model Notification. Available options are marked with ?.`
  The same mismatch applies to `invoiceId` and `requestId`.
- Direct unauthenticated verification of `GET /api/notifications` returned HTTP 401 with `{"error":"Authentication required"}`, confirming auth handling is active. Authenticated requests reached the Prisma validation error in the live server log.
- No web code change was appropriate: the failure is the API agent’s in-progress notification target schema/client mismatch, not an invalid web link, response rendering issue, or fetchJson state transition.

## Verification

- `npm run lint`: passed.
- `git diff --check`: passed.
- `npm run test`: final shared-checkout run is blocked by 8 API tests failing because the API notification target payload changes are incomplete. The focused web notification helper test remains passing.
- `npm run typecheck`: final shared-checkout run is blocked by API routes selecting/creating notification target fields that the generated Prisma client does not yet expose.
- Browser-control reproduction was unavailable because no browser instance was available. The running Next server log provided the authenticated Prisma error above; direct unauthenticated curl returned the expected 401.

## Handoff notes

- API agent action required: finish the notification target migration and regenerate/use the matching Prisma client, then update the affected API tests. The web consumers already accept nullable `projectId`, `invoiceId`, and `requestId` response fields.
- No API, Prisma, or mobile files were changed. Concurrent API migration work and unrelated untracked `public/logo.png` were left untouched.

## Hard rule

Never run `npm install`, `prisma migrate`, or `npx expo install` in this lane.
Commit only owned paths and this file; never use `git add -A`.
