### 2026-08-18 15:48 — Codex — let work queue reach page bottom

Changed:
- Made the final Work queue card absorb the remaining viewport height on larger screens.
- Kept Recent Projects and Notifications at their natural content height so their internal bottom gap does not return.
- Let the Work queue columns share the expanded card height.

Tried and abandoned (what didn't work, and why):
- Leaving the Overview min-height without a flexible final section created an empty strip below the last card.

Left for next session:
- No verification was run, per the user's instruction.

Assumptions made (flag if wrong):
- The Work queue is the most appropriate section to carry the remaining page height because it is the final follow-up area.

Blockers:
- None.
