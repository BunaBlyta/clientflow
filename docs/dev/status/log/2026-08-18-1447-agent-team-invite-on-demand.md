### 2026-08-18 14:47 — Codex — make team invite form on demand

Changed:
- Added an Invite a teammate button to the Team settings header.
- Hidden the invite form until the button is clicked.
- Added a Cancel action and close-on-success behavior for the inline modal form.

Tried and abandoned (what didn't work, and why):
- Keeping the full invite form permanently visible made the Team tab feel heavier than necessary.

Left for next session:
- No verification was run, per the user's instruction.

Assumptions made (flag if wrong):
- “In the modal” means the form should appear within the existing Settings modal rather than opening a second nested dialog.

Blockers:
- None.
