# Custom package API workflow

- Added the public custom inquiry intake and staff-only inquiry list/conversion
  routes using the existing `ContactLead` model.
- Conversion creates the client, package-less pending project, and custom draft
  or sent invoice in one transaction, then sends the existing verification-code
  invitation after commit.
- Added route tests for successful conversion, email failure, staff conflict,
  missing inquiry, public validation, and staff-only access.
- Verification: `npm run test` passed 101 tests, `npm run typecheck` passed, and
  `npm run lint` passed.
