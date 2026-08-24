### 2026-08-18 15:08 — Codex — add overview work queue

Changed:
- Added a full-width Work queue to Overview with three columns: pending requests, unconverted custom inquiries, and overdue invoices.
- Added links, counts, dates, and invoice amounts for actionable follow-up.
- Removed the duplicate standalone Pending Requests card.
- Made Average Turnaround full width so it no longer sits inside an empty second grid column.
- Added English, German, and Albanian translations for the new section labels.

Tried and abandoned (what didn't work, and why):
- Keeping the old Pending Requests card alongside the new queue would repeat the same work list.

Left for next session:
- No verification was run, per the user's instruction.

Assumptions made (flag if wrong):
- Only unconverted custom inquiries belong in the work queue because converted inquiries no longer need follow-up.
- Overdue invoices link to the invoices list because invoice detail routing is not available from the current Overview data shape.

Blockers:
- None.
