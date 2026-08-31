### 2026-08-13 00:49 — Codex — load topbar identity from the API

Changed:
- Removed the remaining `currentStaffUser` import from the dashboard topbar.
- Added a live `GET /api/auth/me` request with loading, error, and retry states.
- Kept notification loading, unread display, settings navigation, and logout
  behavior unchanged.
- Rechecked that the Team flow remains live and that `/accept-invite` stays outside
  the middleware matcher, prefills `?email=`, submits the code/password, surfaces
  the server's invalid-or-expired message, and redirects to `/dashboard` on success.

Tried and abandoned (what didn't work, and why):
- No focused UI test was added because the existing Vitest setup has no React DOM
  testing dependencies and installing them is outside this task's scope.
- The API lane had concurrent unstaged changes while the checks ran; they were
  left untouched and excluded from the web commit.

Left for next session:
- Browser click-through of the live invitation flow remains a Buna verification step
  if a browser session is available.

Assumptions made (flag if wrong):
- `GET /api/auth/me` continues to return a staff identity with `id`, `name`, `email`,
  and `role`, as documented in `docs/ARCHITECTURE.md`.

Blockers:
- None for the web code or requested checks.
