# CURRENT — web UI lane (Agent B)

Last updated: 2026-08-13 13:52 by Codex — staff table navigation and detail pages

## What changed

- Project, client, standard request, and custom inquiry table rows are keyboard-reachable and navigate to their detail pages.
- Existing project status, client invitation, request approve/reject, and custom inquiry conversion controls remain usable without triggering row navigation.
- Added `/dashboard/clients/[id]`, backed by `GET /api/clients/:id`, showing client contact details, related projects, and related invoices.
- Added `/dashboard/requests/[id]`, backed by `GET /api/requests/:id`, showing prospect details, selected package, request message/status, linked client, and related projects.
- Added `/dashboard/inquiries/[id]`, backed by `GET /api/contact-leads/:id`, showing inquiry details, brief, honest email-match conversion context, and related projects.
- Related project links consistently open `/dashboard/projects/[id]`. Existing Projects tabs, request filtering, and custom inquiry filtering are unchanged.
- Added shared table-row interaction detection in `lib/table-navigation.ts` so nested links/buttons do not bubble into row navigation.

## Verification

- `npm run test`: passed — 32 files, 131 tests.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npx next build --webpack`: passed; generated all three new dashboard detail routes.
- `git diff --check`: passed.
- `npm run verify`: typecheck, lint, and tests passed; the Turbopack build was blocked by the sandbox failing to fetch Inter from Google Fonts. The webpack build above passed as the fallback.

## Handoff notes

- No API, Prisma, mobile, or architecture files were changed. The detail pages consume the API contracts from commit `7e5a18c`.
- Custom inquiry conversion is displayed as the API’s email-matched client context, not as a newly invented conversion state.
- An unrelated untracked `public/clientflow-logo-mark.png` remains untouched.

## Hard rule

Never run `npm install`, `prisma migrate`, or `npx expo install` in this lane.
Commit only owned paths and this file; never use `git add -A`.
