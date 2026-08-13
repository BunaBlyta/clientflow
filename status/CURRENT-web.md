# CURRENT — web UI lane (Agent B)

Last updated: 2026-08-13 16:59 by Codex — dashboard polish and public header refinement

## What changed

- Gave the Settings modal a stable 680px-or-viewport-sized frame with an internal scroll area, so its outer shape does not jump between Packages, Team, and Display content.
- Kept the Settings tabs equal-width and restyled them as a higher-contrast pill switcher. The Send invite action now stretches across the form width.
- Kept the Projects tabs, search, and status filter on one horizontal toolbar rail; narrow screens can scroll the rail instead of moving search below the tabs.
- Applied softer shared geometry across buttons, inputs, textareas, selects, dropdowns, popovers, dialogs, cards, badges, tabs, and tooltips.
- Added `public/logo.png` before the Clientflow name in the public marketing navbar and dashboard sidebar.
- Made the marketing header full width, with the Packages / How it works / Contact links centered in the viewport and language/theme controls placed in the right utility area beside the staff and CTA controls.

## Verification

- `npm run test`: passed — 34 files, 141 tests.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npx next build --webpack`: passed.
- `git diff --check`: passed.

The standard `npm run verify` Turbopack build remains subject to the known sandbox port-binding restriction; the webpack production build passed. The other lane's existing mobile edits remain untouched.

## Handoff notes

- No API, Prisma, mobile, architecture, or other lane files were changed.
- The logo is an existing user-provided asset and is staged with this web change.
- Language/theme remain available in dashboard Settings → Display; the public marketing header also provides the controls for unauthenticated visitors.

## Hard rule

Never run `npm install`, `prisma migrate`, or `npx expo install` in this lane.
Commit only owned paths and this file; never use `git add -A`.
