# Notification click navigation fix

Date: 2026-08-13 15:52
Lane: Web UI

## Completed

- Made full-page and topbar notification clicks explicitly navigate after any unread read-state update.
- Changed topbar notification rows to proper dropdown menu items so menu dismissal does not swallow navigation.
- Preserved the shared explicit-ID destination mapping and all loading/error/disabled states.

## Verification

- Tests: 34 files, 138 passed.
- Typecheck, lint, and diff check passed.
- Live request-target notification and request detail endpoint both returned valid responses.
