### 2026-08-17 15:14 — web agent — live staff notifications

Changed:
- Added a dashboard realtime provider using Ably token authentication and the
  user/staff channels from the agreed API contract.
- Consolidated topbar and notifications-page state into a dedicated Zustand
  notification store with ID deduplication, read actions, and BroadcastChannel
  read synchronization.
- Added toast delivery for genuinely new remote notifications only, reconnect
  and focus/visibility catch-up, and degraded-only polling.
- Added debounced entity-change refetch signals to dashboard overview,
  analytics, invoices, projects, and project detail consumers.
- Added pure tests for sorting, merging, and event validation.

Tried and abandoned (what didn't work, and why):
- No separate browser websocket or React Query layer was added. The existing
  Ably client and API loaders are sufficient for this staff surface, and the
  API remains the source of truth for invoice/payment state.

Left for next session:
- Verify against the API lane's realtime token route and publisher once those
  files are ready. Run the full verify gate after Prisma generation is complete.
- Test an actual Ably event and read synchronization in two browser tabs.

Assumptions made (flag if wrong):
- The token endpoint returns either a direct Ably TokenRequest/TokenDetails or
  a `tokenRequest`/`tokenDetails`/`token` wrapper.
- Canonical notification events match the existing web Notification type.

Blockers:
- Full typecheck is blocked by concurrent API-lane changes whose generated
  Prisma client does not yet contain `pushDevice`/`pushDelivery`, plus Stripe
  webhook result narrowing errors outside the web lane.

