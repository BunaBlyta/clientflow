### 2026-08-25 13:45 — Codex — match Meridian visual design

Changed:
- Read and rendered the six-page Meridian Client Portal PDF from the mobile assets folder.
- Replaced the mobile dark gradient/glass presentation with the proposed cream, white, sage, navy, and deep-green visual system.
- Restyled shared cards, buttons, text fields, tab bar, project cards, invoice rows, notification rows, home summary, project detail, and account surfaces.
- Kept stores, API calls, navigation, payment flow, and feature behavior unchanged.

Tried and abandoned (what didn't work, and why):
- System Poppler tools were unavailable, so the PDF was inspected by extracting its embedded page JPEGs for visual review.
- ESLint could not lint the standalone Expo folder because its current configuration ignores all files.

Left for next session:
- The reference PDF remains in `mobile/assets/` for future visual comparisons.

Assumptions made (flag if wrong):
- The PDF is the source of truth for the authenticated client portal screens; existing data and behavior should remain as-is.

Blockers:
- None for the design pass.
