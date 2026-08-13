# CURRENT — web UI lane (Agent B)

Last updated: 2026-08-13 16:42 by Codex — theme and web localization

## What changed

- Added a persisted light/dark theme toggle using `next-themes`. The default follows the operating system, and the provider applies the theme before the page paints to prevent a flash of the wrong theme.
- Kept theme colors token-driven through the existing CSS variables and added dark-mode values for the brand accents. Marketing, auth, dashboard, dialogs, dropdowns, tables, charts, notifications, and payment-result pages use the shared tokens.
- Added a shared locale provider and translation dictionary for English, German, and Albanian. Language selection is available from the marketing navbar, auth pages, and dashboard topbar, persists locally, updates the document language, and falls back to English when a key is missing.
- Localized shared navigation, dashboard headings, tables, status labels, notification controls, auth forms, marketing content/forms, settings/package/team dialogs, invoice/project actions, and payment-result UI.
- API responses and user-generated values remain unchanged: project names, invoice labels/descriptions, notification titles/messages, prospect/client content, and server error messages are not translated or altered.

## Verification

- `npm run test`: passed — 34 files, 141 tests.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npx next build --webpack`: passed.
- `git diff --check`: passed.

The build still reports the repository’s existing middleware-to-proxy deprecation warning. The unrelated untracked `public/logo.png` remains untouched.

## Handoff notes

- No API, Prisma, mobile, or architecture files were changed.
- Locale keys are centralized in `lib/i18n.tsx`; adding another language only requires adding a message map and the locale selector entry.

## Hard rule

Never run `npm install`, `prisma migrate`, or `npx expo install` in this lane.
Commit only owned paths and this file; never use `git add -A`.
