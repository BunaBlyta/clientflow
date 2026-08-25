### 2026-08-25 15:20 — mobile agent — keep project dates on one line

Changed:
- Constrained the Projects list’s Started and Est. launch metadata to a single line, using a small font fallback and right alignment for the launch date.

Verification:
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.

Blockers:
- None.
