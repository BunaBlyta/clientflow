### 2026-08-18 14:19 — Codex — place table controls inside tables

Changed:
- Put search and filter controls inside a bordered table header area for Projects, Requests, Custom inquiries, Clients, and Invoices.
- Kept the Projects tab switcher above the table while moving the project search/status controls into the project table itself.
- Preserved each table's existing search and filter state wiring.

Tried and abandoned (what didn't work, and why):
- Keeping the controls as a separate row made them feel detached from the data they controlled.

Left for next session:
- No verification was run, per the user's instruction.

Assumptions made (flag if wrong):
- The desired treatment applies to every searchable CRM table, including Requests and Custom inquiries.

Blockers:
- None.
