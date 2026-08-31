### 2026-08-18 08:46 — Codex — size language menu to its labels

Changed:
- Removed the shared select popup minimum width from the compact language menu.
- Let the menu size to its longest label plus the even padding.

Tried and abandoned (what didn't work, and why):
- Padding-only overrides did not reduce the visible empty area because the shared popup had a fixed minimum width.

Left for next session:
- User visual check of the compact language dropdown.

Assumptions made (flag if wrong):
- The remaining width was caused by the shared `min-w-36` popup rule.

Blockers:
- None.
