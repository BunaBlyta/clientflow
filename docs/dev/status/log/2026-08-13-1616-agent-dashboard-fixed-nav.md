# Fixed dashboard navigation shell

Date: 2026-08-13
Lane: Web UI

## What changed

The dashboard sidebar is now fixed to the viewport and the topbar is explicitly pinned above the content area. The main dashboard content remains the only scrollable region, so navigation stays visible and cannot move with long pages.

## Verification

- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run test`: passed — 34 files, 141 tests.
- `npx next build --webpack`: passed.
- `git diff --check`: passed.

The unrelated untracked `public/logo.png` was not touched.
