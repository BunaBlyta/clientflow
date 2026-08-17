### 2026-08-17 16:04 — web agent — realtime startup race fix

Changed:
- Moved the first notifications GET until after both Ably channels are
  subscribed. The snapshot now closes the startup gap and recovers events that
  arrived before listeners were attached.
- Kept the store's event-safe ID merge so events arriving during the catch-up
  GET are retained while server records remain authoritative for overlapping
  IDs.
- Added concise sanitized diagnostics for token auth failures, startup/attach
  failures, and degraded connection states. No token or credential values are
  logged.

Tried and abandoned (what didn't work, and why):
- None.

Left for next session:
- Deploy and test a staff dashboard tab while creating a notification or
  payment from another surface. Confirm the browser console reports connected
  state and the notification appears without refresh.

Assumptions made (flag if wrong):
- The API's durable notification GET is the recovery source for events missed
  during startup, as specified by the realtime contract.

Blockers:
- None in the web code. Physical production Ably verification remains a
  deployment task.

