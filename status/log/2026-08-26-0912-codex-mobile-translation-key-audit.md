### 2026-08-26 09:12 — Codex — complete mobile translation key coverage

Changed:
- Added every missing Albanian and German translation for the mobile app.
- Covered auth, note posting, invoice payment dates, checkout errors, and notification loading/date labels.

Tried and abandoned (what didn't work, and why):
- No translation keys were removed or renamed; the audit showed the locales were missing keys rather than carrying invalid extras.

Left for next session:
- Review the wording in the iOS app if any translated phrase needs product-language refinement.

Assumptions made (flag if wrong):
- Albanian and German are the supported non-English mobile locales, matching the existing locale type.

Blockers:
- None. Mobile TypeScript check passed, and the locale audit found 194/194 keys in all three locales.
