### 2026-08-25 15:29 — mobile agent — chat cleanup

Changed:
- Removed the informational warning strip from the top of Notes.
- Inset author names slightly to match the bubble padding and kept sent messages free of the “You” label.
- Right-aligned the Home launch-date metadata.

Verification:
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.

Blockers:
- None.
