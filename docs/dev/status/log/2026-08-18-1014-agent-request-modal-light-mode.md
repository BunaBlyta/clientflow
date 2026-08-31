### 2026-08-18 10:14 — Codex — force light-mode request modal styling

Changed:
- Added explicit light-mode styles to the request-package modal and title so the generic marketing heading gradient cannot create a dark strip.
- Made the textboxes slightly darker than the light page background.
- Removed field borders and focus outlines in light mode.

Tried and abandoned (what didn't work, and why):
- The first scoped heading adjustment was not strong enough against the existing marketing heading cascade, so the modal now has an explicit title override.

Left for next session:
- Nothing specific.

Assumptions made (flag if wrong):
- The requested light-mode change applies to the request-package modal, including its title and form fields.

Blockers:
- None.
