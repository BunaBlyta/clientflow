### 2026-08-12 11:30 — API agent — invoice notification type correction

Changed:
- Invoice creation now stores `INVOICE_ISSUED` for DEPOSIT, FINAL, and CUSTOM
  invoices, while EXTRA invoices retain `EXTRA_CHARGE_CREATED`.
- Added a parameterized test in `app/api/invoices/route.test.ts` covering all
  four invoice types.
- Updated the API lane state file.

Tried and abandoned (what didn't work, and why):
- No implementation approach was abandoned. The existing validated `type` value
  is sufficient for the one-line branch.

Left for next session:
- Buna can use the corrected notification type when reading invoice-created
  notifications from the API.

Assumptions made (flag if wrong):
- DEPOSIT, FINAL, and CUSTOM are invoice-issued events; only EXTRA represents an
  extra charge.

Blockers:
- None.
