### 2026-08-12 10:45 — API agent — current-user endpoint

Changed:
- Added `GET /api/auth/me` for signed-in sessions.
- It returns the user's ID, name, email, and role, plus the linked client ID for
  client sessions.
- Missing or invalid sessions return an empty 401 response.
- Added tests for unauthenticated, staff, and client responses and documented
  the contract for frontend consumers.

Tried and abandoned (what didn't work, and why):
- No production approach was abandoned. Client lookup is only performed for
  client sessions; staff responses need no second database query.

Left for next session:
- Run the full repository verification and commit/push endpoint 5 separately.
- Assess the invitation resend endpoint as the brief's optional thin wrapper.

Assumptions made (flag if wrong):
- `clientId` means the database Client record ID, not the authenticated User ID,
  because client-facing project and invoice contracts use that identifier.

Blockers:
- None for the current-user endpoint.
