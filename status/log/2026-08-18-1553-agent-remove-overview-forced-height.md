### 2026-08-18 15:53 — Codex — remove overview forced height

Changed:
- Removed the Overview viewport minimum height.
- Removed the flexible height behavior from Work queue and its columns.
- All Overview cards now end at their actual content without an artificial gap.

Tried and abandoned (what didn't work, and why):
- Forcing the page or final card to reach the viewport bottom kept moving the unwanted blank gap into whichever card was made flexible.

Left for next session:
- No verification was run, per the user's instruction.

Assumptions made (flag if wrong):
- Natural card height is preferable to filling the entire viewport with empty card space.

Blockers:
- None.
