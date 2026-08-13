### 2026-08-13 11:20 — Codex — payment return and project phase gate

Changed:
- Disabled phase changes for standard projects that are still PENDING until their
  deposit is paid, with an explanation shown beside the current phase.
- Preserved manual phase controls for custom PENDING projects and for projects in
  later phases.
- Added a validated mobile deep-link return from the unauthenticated Stripe success
  page, while retaining the web invoices fallback for normal or incomplete visits.
- Updated the success-page wording so it does not treat the invoice as paid before
  the Stripe webhook confirms the payment.

Tried and abandoned (what didn't work, and why):
- The normal Turbopack production build could not fetch Inter from Google Fonts in
  the sandbox. The webpack production build passed, so no font or configuration
  change was made for this environment-only failure.

Left for next session:
- No known follow-up is required for these two web issues.

Assumptions made (flag if wrong):
- A standard project is identified by a truthy `packageId`; custom projects have a
  null package ID as defined by the API contract.
- Project and invoice IDs are accepted for the mobile return when they contain only
  URL-safe letters, numbers, underscores, or hyphens.

Blockers:
- `npm run verify` is blocked only at the Turbopack font fetch. Typecheck, lint,
  tests, diff check, and `npx next build --webpack` all pass.
