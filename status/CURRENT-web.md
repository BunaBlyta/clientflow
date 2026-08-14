# CURRENT — web UI lane (Agent B)

Last updated: 2026-08-14 09:07 by Codex — fix logo transparency in dark mode

## Current state

- The dashboard home, analytics, clients, notifications/topbar, projects, invoices, project detail, and settings screens read live API data.
- The public package cards and request form read `GET /api/packages` and submit to `POST /api/requests`; the custom inquiry form submits to `POST /api/contact-leads`.
- Request approval/rejection, invoice actions, project status changes, notification read actions, invitations, package editing, invoice creation, and project notes use their live API endpoints.
- The project detail page had one leftover Zustand call that mirrored live status updates into the unused mock store. It has been removed; the page now keeps its server response as its only local source of truth.
- Replaced the flattened checkerboard `public/logo.png` with an RGBA version whose background is actually transparent. The existing marketing navbar and dashboard sidebar references now render cleanly on both light and dark themes.

## Verification

- `npm run test`: passed — 34 files, 141 tests.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npx next build --webpack`: passed.
- `git diff --check`: passed.
- `public/logo.png`: confirmed `hasAlpha: yes`.
- Browser verification was not available: the browser runtime reported no connected browser, and the local dev server was not reachable from this session. Do not describe this task as manually clicked through.

## Handoff notes

- No API, Prisma, mobile, or architecture files were changed.
- The old fixture modules remain in `lib/` for now, but no web page reads them after this cleanup; they were not deleted because they are historical scaffolding and may still be useful for reference.
- The build reports Next’s existing warning that the `middleware` convention is deprecated in favor of `proxy`; this task did not change middleware.

## Hard rule

Never run `npm install`, `prisma migrate`, or `npx expo install` in this lane.
Commit only owned paths and this file; never use `git add -A`.
