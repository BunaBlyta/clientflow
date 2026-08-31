# Live package analytics joins — 2026-08-12

Revenue-by-package and average-turnaround calculations no longer import the
static marketing package fixtures. They now accept the live `ManagedPackage[]`
returned by `GET /api/packages`. Both the dashboard overview and analytics page
load those packages with their other API data and pass them into the helpers.

This repairs the seeded Landing Page join: the API returns `pkg-landing-page`,
`proj-2` uses that ID, and paid invoice `inv-4` contributes 125000 cents. The
all-time Landing Page revenue bar includes that $1,250 deposit and the other
seeded Landing Page project’s $1,250 deposit, for $2,500 total.

Verification: typecheck, lint, and 67 Vitest tests passed. `npm run verify` could
not complete its Turbopack build because the sandbox disallows the process/port
operation; `npx next build --webpack` passed with all 29 routes compiled. A
signed-in local API check passed; no browser connection was available for a
visual click-through in this session.
