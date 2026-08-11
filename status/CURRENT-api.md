# CURRENT — API & database lane (Agent A)

Last updated: 2026-08-11 by Agent A — packages read contract and project package summaries

## Completed

- Existing API work remains in place: authenticated project/invoice reads, staff-only invoice and project status updates, auth and verification-code routes, Stripe checkout/webhook handling, and the seeded Neon-backed data layer.
- Added public `GET /api/packages`, returning active packages ordered by `sortOrder`.
- The package response includes `id`, `name`, `slug`, `description`, `price`, `currency`, `estimatedDuration`, and `sortOrder`. Decimal prices are converted to JSON numbers in major currency units; no Prisma `Decimal` is returned.
- Extended both project GET responses additively. Existing `packageId` remains unchanged, and projects now also include a nullable `package` object with `id`, `name`, `price`, and `currency`.
- Added tests for active-package filtering, sort-order query behavior, Decimal serialization, and the additive package object on both project list and detail responses.
- Updated `docs/ARCHITECTURE.md` with the package and project response contracts.

## Verification

- `npm run verify` was run on 2026-08-11: typecheck, lint, and all 19 tests passed.
- The required Turbopack production build failed only at the documented sandbox process/port restriction (`Operation not permitted`).
- `npx next build --webpack` passed, including the new `/api/packages` route and all 26 static pages/routes.
- No Prisma migration, package install, schema change, frontend file change, or write endpoint was made.

## Handoff

The web lane can use `GET /api/packages` for active pricing data. Project list and detail responses expose the related package summary without requiring a second package lookup, while existing consumers can continue reading `packageId` unchanged. `price` is a number in major currency units, for example `6500` with `currency: "usd"`.

## Known stale project-wide documentation

`STATUS.md` and `docs/HANDOVER-2026-08-11.md` still describe the earlier 13-route, no-write-endpoint state. They were not edited because Buna owns them; they should be refreshed separately.
