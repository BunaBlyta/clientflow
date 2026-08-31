# Theme and web localization

Date: 2026-08-13
Lane: Web UI

## What changed

- Added system-aware, persisted light/dark mode with a no-flash theme provider and shared theme toggle.
- Added persisted English, German, and Albanian locale selection with a centralized dictionary and English fallback.
- Wired localized copy through marketing, authentication, dashboard navigation/pages, tables, dialogs, notifications, and payment-result pages.
- Kept API/user content unchanged and replaced hardcoded auth/marketing accent backgrounds with existing CSS tokens.

## Verification

- `npm run test`: passed — 34 files, 141 tests.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npx next build --webpack`: passed.
- `git diff --check`: passed.

The unrelated untracked `public/logo.png` was not touched.
