# Dashboard shell and project workflow polish

Date: 2026-08-13
Lane: Web UI

## What changed

- Settings now opens as a modal from the account menu. The sidebar entry and the unused Business profile section were removed; the old settings URL redirects to the dashboard.
- The dashboard keeps its sidebar and topbar persistent while the content area scrolls, and sidebar navigation controls have more visual weight.
- Projects search and status filtering now share a row with the project tabs.
- The revenue trend chart now includes an average guide, y-axis values, and visible data points.
- Standard project-request detail pages now include Accept and Deny actions with the existing confirmation and API behavior.

## Verification

- `npm run typecheck`, `npm run lint`, and `npm run test` passed (34 files, 141 tests).
- `npx next build --webpack` passed.
- `git diff --check` passed.
- `npm run verify` reached its build step after passing typecheck, lint, and tests, but Turbopack hit the known sandbox worker port-binding restriction. The webpack build passed.

## Notes

The API does not expose accept/deny for an already-created project, so actions were added to `/dashboard/requests/:requestId`, the supported approval workflow. The unrelated untracked `public/logo.png` was not touched.
