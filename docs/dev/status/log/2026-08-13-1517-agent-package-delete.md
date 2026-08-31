# Package deletion option

Date: 2026-08-13 15:17
Lane: Web UI

## Completed

- Added a confirmation flow to remove an active package from Settings.
- Reused the API’s existing `isActive: false` update so historical projects and invoices remain intact.
- Removed successfully deactivated packages from the active list and kept API errors visible.

## Verification

- Tests, typecheck, lint, webpack build, and diff check passed.
- No API, database, mobile, or architecture files were changed.
