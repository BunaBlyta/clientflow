# CURRENT — web UI lane (Agent B)

Last updated: 2026-08-13 16:49 by Codex — dashboard layout and settings refinements

## What changed

- Kept the Projects tabs, search field, and status filter together in one toolbar row on wider screens, with responsive wrapping when the available width is too narrow.
- Made the staff sidebar navigation labels larger with more vertical spacing. Marketing navigation labels and spacing were also opened up.
- Moved the language selector and theme toggle into a new equal-width Display tab in the Settings modal. The settings panels stay mounted while tabs change, so package and team sections do not remount or refetch on every tab selection.
- Put teammate name, teammate email, and Send invite on separate rows in the team settings form.
- Kept the notifications dropdown scrollable while hiding its scrollbar chrome.
- Removed duplicate language/theme controls from the marketing navbar, auth pages, and dashboard topbar so dashboard display preferences have one clear home.
- Added German and Albanian translations for the new Display settings labels and updated the settings introduction.

## Verification

- `npm run test`: passed — 34 files, 141 tests.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npx next build --webpack`: passed.
- `git diff --check`: passed.

The webpack build still reports the repository’s existing middleware-to-proxy deprecation warning. The unrelated untracked `public/logo.png` remains untouched.

## Handoff notes

- No API, Prisma, mobile, architecture, or other lane files were changed.
- The notification scrollbar uses a shared CSS utility that preserves scrolling and hides the visible scrollbar.
- The settings Display tab uses the existing persisted theme and locale providers, so no new storage or API behavior was introduced.

## Hard rule

Never run `npm install`, `prisma migrate`, or `npx expo install` in this lane.
Commit only owned paths and this file; never use `git add -A`.
