# CURRENT — web UI lane (Agent B)

Last updated: 2026-08-13 15:17 by Codex — package deletion option

## What changed

- Added a confirmed “Delete package” action to the Settings → Packages edit dialog.
- The action uses the existing `PATCH /api/packages/:id` contract with `isActive: false`, so the package is removed from active pricing and new requests without breaking historical project or invoice records.
- On success, the package is removed from the active Settings list and a toast explains that existing projects and invoices are unchanged.
- Failed deletion requests retain the dialog and show the API error. No API, Prisma, mobile, or architecture files were changed.

## Verification

- `npm run test`: passed — 32 files, 132 tests.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npx next build --webpack`: passed.
- `git diff --check`: passed.

## Handoff notes

- This is a safe deactivation, not a destructive database delete; the current API contract explicitly says packages are never deleted.
- Concurrent mobile-lane changes in `mobile/**` and `status/CURRENT-mobile.md` were left untouched and unstaged.
- An unrelated untracked `public/logo.png` remains untouched.

## Hard rule

Never run `npm install`, `prisma migrate`, or `npx expo install` in this lane.
Commit only owned paths and this file; never use `git add -A`.
