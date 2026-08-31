# Project status trigger fix — 2026-08-11 15:37 CEST

## What changed

The project status dropdown now passes the app's shared `Button` component to
`DropdownMenuTrigger render={...}`, matching the working invoice action menu. The
previous bare `<button>` appeared on the row but did not open the Base UI menu.

## Verification

- Automated checks passed: TypeScript, ESLint, all 16 Vitest tests, and the webpack
  production build covering all 25 routes.
- The normal Turbopack build still fails only at the known sandbox process/port
  restriction.
- Browser re-verification is **pending**. The browser runtime reported zero
  available backends in this session, so this agent did not claim to open the menu,
  change a project status, or verify persistence after reload.
- Buna reported the original failure from a real browser and is performing the
  post-fix interaction check.
