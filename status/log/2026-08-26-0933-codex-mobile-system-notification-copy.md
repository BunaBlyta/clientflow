# 2026-08-26 09:33 — Codex — localize all system notification descriptions

Changed:
- Matched mobile notification localization to the backend’s exact system-generated copy, including “Your invoice payment was confirmed,” “Your invoice payment could not be completed,” “Your project is ready,” and invoice-ready/payment descriptions.
- Added localized handling for sent invoice titles and descriptions while preserving invoice, project, package, and person names.
- Kept note content authored by clients or studio staff unchanged.

Verification:
- `npx tsc --noEmit` passed in `mobile/`.
- Locale audit: Albanian and German each have zero missing, extra, or duplicate keys.
- `git diff --check` passed.

Tried and abandoned:
- No source files were committed or pushed, per the user's instruction.

Left for next session:
- Reload the iOS app and verify a confirmed payment and ready-project notification in Albanian or German.

Assumptions made (flag if wrong):
- Only authored note descriptions should remain in their original language; all system-generated descriptions should follow the selected app language.

Blockers:
- None.
