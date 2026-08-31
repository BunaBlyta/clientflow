### 2026-08-31 10:35 — Codex — chat keyboard layout

Changed:
- Replaced the notes screen's manual keyboard-height spacer with React Native's platform-aware keyboard layout wrapper, so the message list and composer resize as one surface.
- Kept the compose strip at the bottom when idle and directly above the keyboard while typing.
- Re-anchored long threads after the viewport resizes and once iOS finishes the keyboard animation, preventing the newest message from being clipped until the user scrolls.

Tried and abandoned (what didn't work, and why):
- A single scroll-to-bottom call at keyboard-animation start was not enough. Simulator testing showed the viewport could settle with the latest message partly clipped, so a final post-animation anchor was added.

Left for next session:
- Nothing for this task.

Assumptions made (flag if wrong):
- Opening the composer should move the chat to its newest message, matching iMessage and Instagram behavior even if an older point in the thread was previously visible.

Blockers:
- Mobile typecheck passes. Root `npm run verify` reaches lint and stops on existing web-lane errors in `components/dashboard/date-picker.tsx` and `components/dashboard/settings-content.tsx`; those files are outside the mobile lane.
