### 2026-08-11 11:58 — Codex — native session storage and project list API

Changed:
- Replaced the native token-storage fallback with Expo SecureStore for the token and saved client snapshot.
- Added the authenticated project-list request and refresh action.
- Changed the project list screen to load the API response with the stored bearer token.

Tried and abandoned (what didn't work, and why):
- No new implementation approach was abandoned. The existing fixture fallback remains intentionally for offline/local API failures.

Left for next session:
- Wire notes, invoices, notifications, verification codes, and checkout as their backend routes become available.
- Test native restart persistence on a simulator or device when Xcode tooling is available.

Assumptions made (flag if wrong):
- `GET /api/projects` returns the same flat project array shape as `GET /api/projects/:id`.
- The API response is authoritative, so the project store replaces its fixture list after a successful refresh.

Blockers:
- Root build remains blocked by the sandbox Turbopack process/port permission error outside `mobile/`.
- No simulator/device is available in the current environment.
