### 2026-08-17 15:48 — Codex — realtime delivery hardening

Changed:
- Made device reassignment and logout cancel queued deliveries atomically.
- Filtered inactive devices from dispatch and added receipt polling, bounded
  retries, and DeviceNotRegistered cleanup.
- Made payment reconciliation use the shared transaction/outbox path.
- Added conditional state claims for invoice sending and project status updates
  so concurrent requests cannot duplicate side effects.
- Added 9 focused regression tests covering privacy, receipt states, retries,
  reconciliation, and concurrency.

Tried and abandoned (what didn't work, and why):
- The default Turbopack build remains unusable in this sandbox because its
  worker cannot bind a process port. The documented Webpack fallback succeeds.

Left for next session:
- Configure Ably and EAS/APNs credentials and validate push delivery on a real
  iPhone.

Assumptions made (flag if wrong):
- A canceled queued push is represented by `FAILED` with a clear `lastError`,
  because the frozen schema has no separate canceled status.
- Five provider attempts are sufficient for transient delivery retries.

Blockers:
- No code blocker. External provider credentials and physical-device testing
  remain deployment tasks.
