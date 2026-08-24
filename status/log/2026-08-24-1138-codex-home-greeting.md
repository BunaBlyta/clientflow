### 2026-08-24 11:38 — Codex — adjust mobile home greeting

Changed:
- Moved the home screen greeting 16px lower and increased its size from 26px to 28px so “Hi Jordan” has more presence without changing the surrounding layout.
- Ran `npx tsc --noEmit` from `mobile/`; it passed.
- Ran `git diff --check` for the mobile change; it passed.

Tried and abandoned (what didn't work, and why):
- None.

Left for next session:
- Nothing specific for this change.

Assumptions made (flag if wrong):
- “Further down and a bit bigger” meant a modest 16px top offset and a 2px font-size increase.

Blockers:
- None.
