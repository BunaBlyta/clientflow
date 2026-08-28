### 2026-08-28 10:03 — Codex — clarify notification archive action

Changed:
- Replaced the notification archive box icon with Lucide's `LibraryBig` icon, which depicts books including one leaning volume.
- Kept the existing restore icon for archived notifications.
- Top-aligned the archive action with the notification content instead of vertically centering it across taller rows.

Tried and abandoned (what didn't work, and why):
- Nothing.

Left for next session:
- Spot-check the icon's top alignment on both one-line and two-line notification bodies.

Assumptions made (flag if wrong):
- The PM's books reference maps to Lucide's `LibraryBig`, and “top leaning” refers to top alignment within the row.

Blockers:
- `npm run verify` stops during root lint on pre-existing web-owned errors in `components/dashboard/date-picker.tsx` and `components/dashboard/settings-content.tsx`.
- No physical device or simulator was available for visual verification.
