# Custom package web workflow

- Replaced the disabled custom-package contact copy with a real form posting to
  `/api/contact-leads`, including pending, error, and success states.
- Added a Custom inquiries tab to the staff Projects page with search and a
  conversion dialog for project, invoice, due-date, and send/draft choices.
- Updated the web state handoff to reflect the live workflow and API contract.
- Verification: `npm run test` passed 101 tests, `npm run typecheck` passed, and
  `npm run lint` passed.
