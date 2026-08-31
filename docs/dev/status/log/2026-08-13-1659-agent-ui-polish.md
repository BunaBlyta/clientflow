# Web UI handoff — 2026-08-13 16:59

## Changed

- Stabilized and internally scrolled the Settings modal.
- Restyled Settings and Projects tabs as pill controls with stronger selected/unselected contrast.
- Kept project tabs, search, and filter side by side in a horizontal rail.
- Made Send invite full width.
- Rounded shared controls and surfaces to remove the harsh square treatment.
- Added the existing logo asset to the public and dashboard app wordmarks.
- Made the public header full width with centered marketing links and right-side language/theme utilities.

## Verification

- `npm run test` — passed (34 files, 141 tests)
- `npm run typecheck` — passed
- `npm run lint` — passed
- `npx next build --webpack` — passed
- `git diff --check` — passed

No API, database, mobile, or other lane files were changed.
