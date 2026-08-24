### 2026-08-24 08:50 — Codex — correct mobile notes ordering

Changed:
- Removed an extra reversal from the Notes screen. The data store already returns notes oldest-to-newest, so the newest note now remains at the bottom beside the composer.

Tried and abandoned (what didn't work, and why):
- The first chat rendering reversed the store result based on an outdated comment and displayed the conversation upside down; that reversal was removed.

Left for next session:
- None beyond the existing native-device review noted in the mobile lane state.

Assumptions made (flag if wrong):
- Chat timeline order should be oldest at the top and newest at the bottom.

Blockers:
- None.
