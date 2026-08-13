### 2026-08-13 13:30 — API agent — staff detail contracts

Changed:
- Added `GET /api/clients/:id` with the client, all related projects, and all
  related invoices in one staff-friendly response.
- Added staff-only `GET /api/requests/:id` with request, package, linked client,
  and client-project details.
- Added staff-only `GET /api/contact-leads/:id` with inquiry, existing-client
  context, and client-project details.
- Added focused route tests and documented the contracts.

Tried and abandoned (what didn't work, and why):
- Did not infer a custom inquiry's converted state from an email match or from
  project timestamps. A returning client can submit multiple inquiries, so
  those heuristics would hide a legitimate staff conversion action or permit
  duplicate conversions.

Left for next session:
- Web needs to add links/detail surfaces for request, inquiry, and client rows
  and use the new aggregate responses.
- A future backend task should add a persisted lead-to-project conversion link
  before changing the custom inquiry list's “Converted” label.

Assumptions made (flag if wrong):
- The existing approval and custom-conversion transactions are the source of
  truth for project creation; `GET /api/projects` already exposes those rows.
- A client may have multiple projects, so the detail contracts intentionally
  return a list rather than guessing one “current” project.

Blockers:
- None for the read contracts. Exact per-inquiry conversion tracking requires a
  schema change and Buna-owned migration/generation work, so it was explicitly
  left unmodified rather than shipped as an unreliable heuristic.
