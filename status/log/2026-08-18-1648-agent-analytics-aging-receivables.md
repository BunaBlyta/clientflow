### 2026-08-18 16:48 — Codex — add analytics aging and receivables charts

Changed:
- Added Project aging bars for active projects grouped by time since last update.
- Added Upcoming receivables bars for unpaid invoice value grouped into overdue, next 7 days, 8–30 days, and later.
- Added localized labels for English, German, and Albanian.
- Kept both visualizations in the existing Analytics card grid with subdued page-scoped separators.

Tried and abandoned (what didn't work, and why):
- No additional chart library was needed; these compact operational distributions are clearer as native horizontal bars alongside the existing Recharts visuals.

Left for next session:
- No verification was run, per the user's instruction.

Assumptions made (flag if wrong):
- Project age is measured from `updatedAt`, and receivables include issued unpaid invoices with a due date.

Blockers:
- None.
