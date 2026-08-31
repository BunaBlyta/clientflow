### 2026-08-18 17:56 — Codex — extend aging axis on wide cards

Changed:
- Added a ResizeObserver-based width check to the project aging chart.
- Kept compact cards at 30–45 day domains and extended wider cards to a 60-day domain.
- Preserved the data-driven domain when projects are older than the responsive minimum.

Tried and abandoned (what didn't work, and why):
- A single fixed day domain made the x-axis feel either cramped on small cards or underused on wide cards.

Left for next session:
- No verification was run, per the user's instruction.

Assumptions made (flag if wrong):
- The card’s rendered width is the right signal for extending the aging day domain.

Blockers:
- Live browser inspection was unavailable in this session.
