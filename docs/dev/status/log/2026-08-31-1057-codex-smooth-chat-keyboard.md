### 2026-08-31 10:57 — Codex — smooth chat keyboard animation

Changed:
- Replaced the chat screen's layout-driven iOS keyboard response with one native-driver transform for the entire message list and compose strip.
- Started that transform from the keyboard's pre-animation frame event, so the strip no longer begins moving after the keyboard.
- Kept Android on its native window-resize behavior and preserved the existing bottom resting position.

Tried and abandoned (what didn't work, and why):
- `KeyboardAvoidingView` produced the right final layout but visibly lagged because its padding update depended on a later React Native layout pass.
- Post-animation scroll correction kept the latest message visible, but made the movement feel like two separate pushes; the native transform preserves list/composer spacing without that correction.

Left for next session:
- Nothing for this task.

Assumptions made (flag if wrong):
- The requested messaging-app feel prioritizes moving the current message surface and composer as one stable unit over relaying out every message during the keyboard animation.

Blockers:
- Mobile typecheck passes. Root `npm run verify` still stops on existing web-lane lint errors in `components/dashboard/date-picker.tsx` and `components/dashboard/settings-content.tsx`.
