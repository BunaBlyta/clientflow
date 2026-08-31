### 2026-08-13 14:36 — API agent — mobile Stripe cancel return

Changed:

- Added the fixed mobile Stripe cancel URL to `POST /api/stripe/checkout`.
- Required existing mobile Checkout Sessions to have both matching mobile
  success and cancel URLs before reuse; incompatible sessions are replaced.
- Added focused route tests and documented the API contract.

Verification:

- `npm run test`: passed — 32 test files, 132 tests.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npx next build --webpack`: passed after retrying around a shared build lock.
- `git diff --check`: passed.

Notes:

- No Prisma schema, migration, install, payment-page, or mobile change was
  made. The parallel web-lane payment page change was left outside this task.
