# CURRENT — web UI lane (Agent B)

Last updated: 2026-08-13 16:01 by Codex — make live notification clicks useful

## What changed

- Fixed the real notification navigation failure after checking the authenticated local API: 19 of 20 existing staff notifications have no project, invoice, or request ID, so they previously linked straight back to Notifications and appeared inert.
- Notifications with IDs still open the exact request or project; invoices continue to open the invoice list because no invoice detail route exists.
- Older notifications without IDs now open the relevant working area: standard requests, custom inquiries, projects, or invoices according to their notification kind.
- Clicking now starts navigation immediately and marks unread items in the background, so a slow or failed read-state request cannot block the user from opening the destination.
- The Projects page now recognizes and stays synchronized with both `?tab=requests` and `?tab=custom`, making both notification fallbacks land on the intended tab.

## Verification

- Authenticated live API inspection confirmed the missing target IDs on existing notifications and one seeded request notification with `requestId: "req-1"`.
- All five destinations returned HTTP 200: requests tab, custom-inquiries tab, projects list, invoices list, and request detail.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run test`: passed — 34 files, 141 tests.
- Production build passed with Next's webpack path. The default Turbopack build remains blocked only by the execution environment denying its worker port.
- `git diff --check`: passed.

## Handoff notes

- The browser plugin had no connected browser, so click automation was unavailable. The live authenticated API, destination routes, click handlers, helper tests, and production compilation were verified directly.
- No API, Prisma, mobile, or payment files were changed.
- Unrelated untracked `public/logo.png` remains untouched.

## Hard rule

Never run `npm install`, `prisma migrate`, or `npx expo install` in this lane.
Commit only owned paths and this file; never use `git add -A`.
