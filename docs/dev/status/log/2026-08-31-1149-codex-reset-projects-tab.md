### 2026-08-31 11:49 — Codex — reset Projects tab

Changed:
- Tapping the Projects tab now always opens the project list instead of restoring a remembered project detail or chat screen.
- Added a nested-stack reset when leaving Projects and an explicit project-list destination when pressing its tab icon.
- Kept intentional links from Home, Invoices, and Notifications into specific project screens working as before.

Tried and abandoned:
- Relying on the tab navigator's default behavior; nested tab state is preserved by design, which caused the chat screen to reopen.

Left for next session:
- Nothing.

Assumptions:
- Tapping the Projects tab means “show the project list,” while an explicit project link elsewhere should still open its requested detail screen.

Blockers:
- Mobile typecheck passes. Root verification still stops on the existing web-lane lint errors in `components/dashboard/date-picker.tsx` and `components/dashboard/settings-content.tsx`.
