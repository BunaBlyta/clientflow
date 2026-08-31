### 2026-08-24 15:10 — Codex — clean mobile navigation

Changed:
- Centralized tab animation in the navigator so all tabs use one timing path.
- Added dedicated Invoices and Notifications stacks so detail and checkout flows no longer activate Projects.
- Reused the existing project/invoice screen implementations inside those stacks.
- Replaced native headers and mixed back labels with one borderless app-owned arrow control across app and auth screens.

Tried and abandoned (what didn't work, and why):
- Per-screen focus animations looked inconsistent because they started after each screen's own render and refresh work.
- Expo Router URL pushes into nested Projects routes briefly exposed the project screen before the final invoice route.
- A light opacity fade let outgoing invoice and notification content show through and look like a wrong-route flash.
- Timing tweaks and custom cross-tab exit listeners treated symptoms but did not fix route ownership.

Left for next session:
- Home shortcuts still intentionally open canonical Project routes in Projects; revisit only if the same origin-owned navigation rule should also apply to Home.
- Root verification has unrelated web-lane lint failures.

Assumptions made (flag if wrong):
- The active tab should reflect the flow's entry point for Invoices and Notifications.
- Payment state and checkout logic must be shared, even when multiple tab stacks render the same invoice UI.

Blockers:
- None in the mobile lane.
