# Clickable notification navigation

Date: 2026-08-13 15:28
Lane: Web UI

## Completed

- Added one explicit-ID notification destination helper and used it in the full notification page and topbar dropdown.
- Added read-before-navigation behavior to unread topbar notifications while preserving the full page’s existing read behavior.
- Added nullable optional notification target fields to web types and focused helper tests.

## Verification

- Focused helper tests, lint, and diff check passed.
- The final full test/typecheck rerun is blocked by concurrent API-owned Prisma/schema and API-test changes for the same notification target fields. No API or Prisma files were changed in this lane.
