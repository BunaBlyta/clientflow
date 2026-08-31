### 2026-08-28 09:46 — Codex — standardize mobile semantic colors

Changed:
- Replaced the mobile theme's muted green, ochre, and brick semantic palettes with standard success green, warning orange, and error red palettes.
- Updated light and dark theme text/icon, background, and border tokens together.
- Left the app's brand green, decorative palette, existing badges/messages, and UI structure unchanged.

Tried and abandoned (what didn't work, and why):
- Nothing.

Left for next session:
- Spot-check existing paid/processing/failed badges and feedback messages in both themes on a device.

Assumptions made (flag if wrong):
- This request applies to the mobile app discussed in the current payment-flow review, not the web dashboard.

Blockers:
- `npm run verify` stops during root lint on pre-existing web-owned errors in `components/dashboard/date-picker.tsx` and `components/dashboard/settings-content.tsx`.
- No physical device or simulator was available for visual verification.
