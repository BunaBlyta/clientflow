### 2026-08-18 10:31 — Codex — align request fields with warning rows

Changed:
- Fixed the name/company label rows to the same height.
- Prevented warning text from wrapping and changing the side-by-side textbox alignment.

Tried and abandoned (what didn't work, and why):
- A minimum-height label row still allowed wrapped warning text to grow, so the row now has a fixed height and non-wrapping warning copy.

Left for next session:
- Nothing specific.

Assumptions made (flag if wrong):
- Keeping the compact warning on one line is preferable to moving the textboxes or increasing the modal height.

Blockers:
- None.
