### 2026-08-12 10:55 — API agent — resend client invitation endpoint

Changed:
- Added staff-only `POST /api/clients/:id/resend-invitation`.
- It looks up the client record, reuses the existing verification-code and email
  helper, and returns `{ emailSent: true }` on delivery.
- If email delivery fails, it returns `{ emailSent: false }` so the caller can
  show the right result without confusing it with an unknown client.
- Added tests for staff authorization, successful resend, failed delivery, and
  unknown clients; documented the contract.

Tried and abandoned (what didn't work, and why):
- Nothing was abandoned. This endpoint stayed within the brief's allowed thin
  wrapper because verification-code generation and Resend delivery already live
  in one shared helper.

Left for next session:
- Run the full repository verification and commit/push endpoint 6 separately.
- Buna should call each new endpoint against Neon and read the resulting rows
  back before the demo. No migration or package install is needed.

Assumptions made (flag if wrong):
- The route uses the Client record ID in the URL, matching the existing clients
  GET response and the table-action wording in the brief.

Blockers:
- None for endpoint 6.
