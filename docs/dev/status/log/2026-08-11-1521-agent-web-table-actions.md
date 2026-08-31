# Web table actions — 2026-08-11 15:21 CEST

## What changed

- Restored invoice row actions on the live invoices table using the staff-only
  invoice PATCH endpoint.
- Limited invoice actions to legal Send and Void transitions derived from the
  current invoice status, kept the Void confirmation, and surfaced API errors.
- Deleted “Mark as paid” and the unused mock store action so payment confirmation
  remains webhook-only.
- Reused the existing project status menu on the projects table and connected it
  to the staff-only project PATCH endpoint.
- Both tables now apply the exact record returned by the server after a successful
  write instead of guessing the new state locally.

## Verification

- Automated checks passed: TypeScript, ESLint, and all 16 Vitest tests.
- The normal Turbopack build reached the known sandbox process/port restriction.
- The webpack fallback production build passed and compiled all 25 routes.
- Browser verification is **pending**. Browser discovery returned zero available
  backends, so this agent did not click Send, Void, or a project status change and
  did not verify persistence after refresh.
- Buna is performing the signed-in browser click-through and will send any bugs as
  follow-up work.

## Tried and abandoned

- Tried connecting to the in-app browser after starting the local app. The browser
  runtime reported no available backend, so no substitute was used and no browser
  success was claimed.
