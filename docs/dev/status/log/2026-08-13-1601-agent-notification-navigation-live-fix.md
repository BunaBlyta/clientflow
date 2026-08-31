### 2026-08-13 16:01 — Codex — notification navigation live fix

Changed:
- Reproduced the underlying problem against the authenticated local API: almost every existing staff notification had no target ID and therefore linked back to the page it was already on.
- Added useful list/tab destinations for older notifications while retaining exact detail destinations whenever the API supplies an ID.
- Made navigation immediate instead of waiting for the notification's read-state update.
- Made the Projects page URL control both the Requests and Custom inquiries tabs.

Tried and abandoned (what didn't work, and why):
- The in-app browser had no connected browser instance, so UI click automation was unavailable.
- The default Turbopack production build reached the known sandbox-only worker-port denial; the supported webpack build completed successfully.

Left for next session:
- Nothing for this fix. Buna should click one old standard-request notification, one custom-inquiry notification, and the seeded request notification in the browser for final human confirmation.

Assumptions made (flag if wrong):
- Existing notifications with no record ID should open the narrowest relevant working list instead of remaining on Notifications.
- The stable title `New custom inquiry` is the only available way to distinguish custom inquiries from older standard requests because custom inquiries intentionally have no request record.

Blockers:
- None in the code. Browser automation was unavailable, but the live data and all destination routes were verified directly.
