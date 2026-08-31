### 2026-08-25 13:53 — Codex — complete Meridian screen pass

Changed:
- Reworked the remaining active mobile screens against all six reference pages, not only the shared palette.
- Added the proposal-style home greeting and recent activity section.
- Rebuilt project detail around the overview ring, phase tracker, dates, and notes composition.
- Removed remaining dark/glass styling from notes, invoice detail, and checkout.
- Adjusted invoice actions, notification grouping, account profile/settings, and stage tracker presentation.
- Added localized greeting strings while leaving all API, store, navigation, and payment logic intact.

Tried and abandoned (what didn't work, and why):
- No new feature or backend route was added; reference-only settings items were not invented where the app has no existing behavior for them.

Left for next session:
- The mobile reference PDF remains in `mobile/assets/`.

Assumptions made (flag if wrong):
- “Match everything” means all active mobile route surfaces should share the PDF's visual system and compositions while existing product behavior stays unchanged.

Blockers:
- None.
