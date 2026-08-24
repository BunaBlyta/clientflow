### 2026-08-18 14:50 — Codex — keep settings modal size fixed

Changed:
- Set the Settings modal to a compact fixed 600px height.
- Kept the same modal size when switching between Packages and Team.
- Made the content area scroll internally when it exceeds the fixed height.

Tried and abandoned (what didn't work, and why):
- An auto-height modal changed size between tabs, which felt unstable.

Left for next session:
- No verification was run, per the user's instruction.

Assumptions made (flag if wrong):
- 600px is compact enough to remove the old blank space while fitting the normal Settings content.

Blockers:
- None.
