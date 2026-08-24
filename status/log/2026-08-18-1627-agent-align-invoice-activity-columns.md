### 2026-08-18 16:27 — Codex — align invoice activity columns

Changed:
- Replaced flex distribution in Recent invoice activity rows with fixed grid columns.
- Separated amount and date into their own aligned columns.
- Kept labels flexible while preventing status, amount, and date from shifting between rows.

Tried and abandoned (what didn't work, and why):
- A `justify-between` flex row moved the trailing fields whenever invoice labels had different lengths.

Left for next session:
- No verification was run, per the user's instruction.

Assumptions made (flag if wrong):
- The intended second column is the invoice status column, which should align consistently with amount and date.

Blockers:
- None.
