# Web UI handoff — 2026-08-13 16:49

## Changed

- Grouped the Projects tabs, search, and status filter into the same toolbar row.
- Increased navigation label size and spacing in the dashboard sidebar and marketing navbar.
- Added a Display tab to the Settings modal for language and theme controls, with equal-width tabs and mounted panels retained across tab changes.
- Separated teammate name, email, and invitation submission into distinct rows.
- Made the notification dropdown scroll without showing a scrollbar.
- Removed duplicate language/theme controls from marketing, auth, and topbar surfaces.

## Verification

- `npm run test` — passed (34 files, 141 tests)
- `npm run typecheck` — passed
- `npm run lint` — passed
- `npx next build --webpack` — passed
- `git diff --check` — passed

No API, database, mobile, or other lane files were changed. Native/mobile behavior was not part of this task.
