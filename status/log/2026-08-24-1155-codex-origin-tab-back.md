### 2026-08-24 11:55 — Codex — restore originating tab on back

Changed:
- Added origin parameters when Invoices and Notifications open project or invoice details.
- Added a shared origin-aware back handler with a labeled header button and native `beforeRemove` handling.
- Returning from an invoice opened in Invoices now goes back to Invoices; notification destinations return to Notifications.
- Existing navigation from inside the Projects flow keeps its normal project-stack behavior.
- Ran `npx tsc --noEmit` from `mobile/`; it passed.
- Ran `npx expo export --platform web --output-dir /private/tmp/clientflow-mobile-origin-back`; it passed.
- Ran `git diff --check` for the mobile change; it passed.

Tried and abandoned (what didn't work, and why):
- The installed Expo Router typings did not expose the prevent-remove hook from the package entrypoint, so the shared handler uses the supported navigation `beforeRemove` event instead.

Left for next session:
- Nothing specific for this change.

Assumptions made (flag if wrong):
- “Go back to the tab I was on” applies to both the visible header back control and the device back gesture/button.

Blockers:
- None.
