### 2026-08-25 15:27 — mobile agent — simplify sent chat metadata

Changed:
- Removed the “You” label from sent chat messages.
- Kept the author name aligned with the corresponding bubble edge.

Verification:
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.

Blockers:
- None.
