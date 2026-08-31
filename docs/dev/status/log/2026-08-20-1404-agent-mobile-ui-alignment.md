### 2026-08-20 14:04 — mobile agent — align mobile UI with the web CRM

Changed:
- Replaced the blue/cyan treatment with a monochrome accent system: black/grey
  controls and text on the same grey canvas and white panels as the web CRM.
- Removed gradient buttons, elevation shadows, and the large cyan backdrop
  treatment; kept only a subtle accent detail on auth screens.
- Tightened radii, standardized screen top spacing, and removed repeated
  `CLIENTFLOW` labels from in-app tab headers.
- Simplified project rows, the stage tracker, invoice list surfaces, notes
  composer, and account/list spacing while preserving behavior.
- Reworked Home with a web-aligned composition: personal avatar header, white
  bordered project-status panel, muted tracker area, and paid/outstanding
  metrics.
- Added paid/outstanding totals to the global Invoices screen and status-colored
  rails to project rows.

Tried and abandoned (what didn't work, and why):
- A live browser screenshot pass was attempted, but no browser connection was
  available. The Expo web export was used for the platform-level smoke check.
- No new UI dependency was added; the existing shared components were enough to
  carry the visual change across the app.

Left for next session:
- Review the refreshed tab bar, auth screens, tracker, and account spacing on a
  physical iPhone or simulator, especially with long German and Albanian text.

Assumptions made (flag if wrong):
- The mobile app should follow the web CRM’s latest grey-canvas, white-panel,
  table-like direction rather than a separate mobile-only hero treatment.
- The repeated in-app `CLIENTFLOW` eyebrow was visual noise because the web
  dashboard presents direct page headings in its shell.

Blockers:
- No physical device, simulator, or in-app browser was available for visual QA.
