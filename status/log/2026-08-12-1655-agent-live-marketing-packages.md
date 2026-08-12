# Live marketing packages — 2026-08-12

- Replaced the public pricing section’s Zustand fixture read with
  `GET /api/packages` through the shared `fetchJson` helper.
- Added loading, error, and empty states. The request form only appears when
  live standard packages are available.
- Adapted the display to the API’s `ManagedPackage` contract: live name,
  description, price, currency, and estimated duration. The `web-app-build`
  slug remains the custom tier.
- Typecheck, lint, and all 73 tests passed. The Turbopack build was blocked by
  the sandbox process/port restriction; the webpack production build passed.
