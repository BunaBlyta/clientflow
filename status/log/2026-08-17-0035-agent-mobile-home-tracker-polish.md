### 2026-08-17 00:35 — mobile agent — home and tracker polish

Changed:
- Removed the duplicate invoice number from the Home invoice summary.
- Reworked the stage tracker’s active metadata so “Currently in progress” is
  always below the phase name and cannot overlap it.
- Added a translated “Next up” heading for Home’s action section.
- Tightened project-row status rendering with a single computed status meta and
  safer one-line status labels.

Tried and abandoned:
- No new interaction or data behavior was introduced; the existing Home
  summary and tracker structure were retained.

Left for next session:
- Review the tracker with long Albanian/German translations on a device.

Assumptions made:
- The invoice summary should retain the localized “5 invoice(s)” copy and drop
  the separate large numeral so the count is shown exactly once.

Blockers:
- No connected simulator/browser was available for visual QA.
