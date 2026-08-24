### 2026-08-18 15:26 — Codex — limit overview rows by viewport height

Changed:
- Changed Recent Projects and Notifications row visibility from width-based to height-based breakpoints.
- Reduced the default visible rows to two, then progressively show three through six rows as the viewport gets taller.
- Allowed the shared cards to shrink within the Overview layout so the shorter viewport does not force extra page height.

Tried and abandoned (what didn't work, and why):
- Width-based row counts showed too many rows on wide but short screens and could force a page scrollbar.

Left for next session:
- No verification was run, per the user's instruction.

Assumptions made (flag if wrong):
- Vertical viewport height is the relevant constraint for choosing how many rows fit without scrolling.

Blockers:
- None.
