### 2026-08-12 10:10 — API agent — create note endpoint

Changed:
- Added `POST /api/notes` for staff and clients with `projectId` and `body`.
- The session supplies the author and the route always writes `isSystem: false`.
- Client ownership is checked server-side; another client's project returns 404
  and creates neither a note nor a notification.
- Client notes notify staff users, staff notes notify the project client, and the
  author is not notified about their own note.
- Added tests for cross-client privacy, both author roles, ignored body fields,
  and the shared response shape. Documented the contract for frontend consumers.

Tried and abandoned (what didn't work, and why):
- No production approach was abandoned. The endpoint is implemented as one
  transaction so the note and its opposite-side notifications succeed or fail
  together.

Left for next session:
- Run the full repository verification and commit/push this endpoint separately.
- Implement `PATCH /api/notifications/[id]` with ownership-safe idempotent reads.

Assumptions made (flag if wrong):
- A client note notifies every staff user because staff share one permission tier
  and the note feed is a shared studio activity stream.
- A missing or cross-client project is intentionally reported as 404 to avoid
  confirming another client's data exists.

Blockers:
- None for the notes endpoint.
