### 2026-08-24 11:50 — Codex — add Notes and Invoices card separators

Changed:
- Added a hairline separator beneath the Notes and Invoices card headers.
- Added footer separators after the Notes preview and before the invoice count footer.
- Kept the existing surfaces, buttons, rows, and navigation unchanged.
- Ran `npx tsc --noEmit` from `mobile/`; it passed.
- Ran `npx expo export --platform web --output-dir /private/tmp/clientflow-mobile-notes-invoice-separators`; it passed.
- Ran `git diff --check` for the mobile change; it passed.

Tried and abandoned (what didn't work, and why):
- None.

Left for next session:
- Nothing specific for this change.

Assumptions made (flag if wrong):
- “Separators in header and footer” means subtle rules beneath each card header and around the trailing content area, not heavy borders around the cards.

Blockers:
- None.
