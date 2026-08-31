# 2026-08-26 09:21 — Codex — translate mobile UI on language switch

Changed:
- Made mobile date, time, currency, and relative-time formatting use English, Albanian, or German based on the selected language.
- Localized system-generated notification titles and recognizable payment, invoice, and project-stage messages in the notifications list, banner, and Home summary.
- Localized remaining auth placeholders and replaced raw English API errors with translated fallback messages.
- Kept user-written note bodies unchanged, since translating client/studio-authored content would alter the original message.

Verification:
- `npx tsc --noEmit` passed in `mobile/`.
- Locale audit: Albanian and German each have zero missing, extra, or duplicate keys against English.
- Translation-call audit: 177 keys used by mobile source, zero undefined keys.
- `git diff --check` passed.

Tried and abandoned:
- No source files were committed or pushed, per the user's instruction.

Left for next session:
- Manually switch to Albanian and German in the iOS app and review long dynamic notification phrases for visual wrapping.

Assumptions made (flag if wrong):
- User-authored note content should remain in its original language; system-generated labels and messages should follow the selected app language.

Blockers:
- None.
