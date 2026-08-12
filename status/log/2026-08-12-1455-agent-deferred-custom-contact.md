# Deferred custom contact flow — 2026-08-12

The custom web app section no longer accepts an online form submission. It keeps
the “Custom web app build” heading and explanation, then directs prospects to
`buna@tetbit.studio` with a prefilled email subject. This matches the deferred
custom-package decision in `docs/SPEC.md` and prevents a fake success message or
an invisible in-memory lead.

The unused frontend `ContactLead` type, mock data, Zustand state, and
`submitContactLead` action were removed. The Prisma model and migration remain
untouched because they belong to the API/database lane.

Verification: typecheck, lint, and 66 Vitest tests passed. `npm run verify` could
not complete its Turbopack build because the sandbox disallows the process/port
operation; `npx next build --webpack` passed with all 29 routes compiled.
