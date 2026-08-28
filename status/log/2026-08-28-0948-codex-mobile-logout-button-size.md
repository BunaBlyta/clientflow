### 2026-08-28 09:48 — Codex — align logout confirmation buttons

Changed:
- Moved the Cancel and Log out confirmation actions onto one shared button base style.
- Set both to the original logout control's 56px height and large corner radius.
- Preserved each action's existing neutral/error color, label, and behavior.

Tried and abandoned (what didn't work, and why):
- Nothing.

Left for next session:
- Spot-check the expanded logout confirmation row on a narrow device and in German.

Assumptions made (flag if wrong):
- The two confirmation actions should match both each other and the full-width logout control they replace.

Blockers:
- `npm run verify` stops during root lint on pre-existing web-owned errors in `components/dashboard/date-picker.tsx` and `components/dashboard/settings-content.tsx`.
- No physical device or simulator was available for visual verification.
