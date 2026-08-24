### 2026-08-18 14:39 — Codex — fix settings modal width override

Changed:
- Added explicit responsive max-width overrides to Settings DialogContent.
- Prevented the shared `sm:max-w-sm` dialog default from capping Settings at the small modal width.

Tried and abandoned (what didn't work, and why):
- Changing only the Settings width class had no visible effect because the shared dialog max-width rule still won at the small breakpoint.

Left for next session:
- No verification was run, per the user's instruction.

Assumptions made (flag if wrong):
- The intended Settings width is the currently selected 960px now that the override works.

Blockers:
- None.
