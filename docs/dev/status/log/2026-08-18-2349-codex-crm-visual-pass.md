### 2026-08-18 23:49 — Codex — CRM visual pass

Changed:
- Added a live project-pipeline strip to the Overview page using existing project stages.
- Kept the turnaround card in its compact layout after reviewing the clearer alternative.
- Refined light CRM surfaces, sidebar states, focus borders, filter controls, and the full-width sidebar expander.
- Made the Add a note text start slightly farther from the left edge.
- Fixed the Overview time read so the current lint rule accepts the render.

Tried and abandoned:
- A stronger cool-grey canvas, card shadows, an active-nav accent marker, and a more structured turnaround card were all reverted after visual review.

Left for next session:
- CRM visual changes are committed in the current web lane. The next refinement should preserve the flat, table-like direction.

Assumptions made:
- The current visual direction is white page background, flat borders, neutral sidebar states, and no elevation shadows.

Blockers:
- None. Turbopack still hits the known sandbox process/port panic; the webpack production build passes.
