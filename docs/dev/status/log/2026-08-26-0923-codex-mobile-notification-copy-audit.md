# 2026-08-26 09:23 — Codex — finish notification translation coverage

Changed:
- Added translations for the backend's generic notification titles and bodies, including project requests, invoice-ready alerts, payment updates, status updates, and new project notes.
- Kept custom invoice, payment, and stage-change messages localized when their known English structure can safely preserve project, invoice, and author names.

Verification:
- `npx tsc --noEmit` passed in `mobile/`.
- Locale audit: 246 English keys; Albanian and German each have zero missing, extra, or duplicate keys.
- Translation-call audit: 191 keys used by mobile source, zero undefined keys.
- `git diff --check` passed.

Tried and abandoned:
- No source files were committed or pushed, per the user's instruction.

Left for next session:
- Manually switch to Albanian and German in the iOS app and review long notification phrases for visual wrapping.

Assumptions made (flag if wrong):
- User-authored note bodies remain unchanged; system-generated notification copy follows the selected language.

Blockers:
- None.
