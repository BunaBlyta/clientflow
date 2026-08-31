# 2026-08-26 09:25 — Codex — fix React Native relative-time crash

Changed:
- Removed the `Intl.RelativeTimeFormat` constructor from mobile relative-time formatting because the current React Native runtime does not expose it.
- Added runtime-safe English, Albanian, and German relative-time strings for notification rows and note previews.

Verification:
- `npx tsc --noEmit` passed in `mobile/`.
- `git diff --check` passed.

Tried and abandoned:
- No source files were committed or pushed, per the user's instruction.

Left for next session:
- Reload the iOS app and confirm the Notifications screen renders in all three languages.

Assumptions made (flag if wrong):
- Compact relative timestamps such as “2m ago” should stay compact in English while using natural localized equivalents in Albanian and German.

Blockers:
- None.
