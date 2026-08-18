### 2026-08-18 10:26 — Codex — add inline request-field validation

Changed:
- Replaced native browser required-field popups in the package request form with blue inline labels below empty name and email fields.
- Added inline email-format feedback and accessible `aria-invalid`/description links.
- Added translated required and invalid-email messages for English, German, and Albanian.

Tried and abandoned (what didn't work, and why):
- Native browser validation was intentionally disabled because its popup does not match the app’s visual language.

Left for next session:
- Nothing specific.

Assumptions made (flag if wrong):
- The request-package form is the scope for these inline empty-field warnings.

Blockers:
- None.
