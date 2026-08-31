### 2026-08-18 11:36 — Codex — standardize CRM table row height

Changed:
- Set normal CRM table body rows to a fixed 64px height across invoices, projects, clients, requests, and detail tables.
- Removed variable vertical cell padding and vertically centered the row content.
- Kept colspan empty and no-results rows flexible.

Tried and abandoned (what didn't work, and why):
- None.

Left for next session:
- Changes are uncommitted as requested. No checks were run as requested.

Assumptions made (flag if wrong):
- A 64px row is the right shared size for the CRM’s one-line invoice rows and multi-line project/client rows.

Blockers:
- None.
