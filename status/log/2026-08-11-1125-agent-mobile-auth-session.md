### 2026-08-11 11:25 — Codex — mobile auth and session wiring

Changed:
- Connected mobile login to the backend login route and stored the returned token for web restarts.
- Added bearer-token project-detail refresh against the backend route already documented by the API lane.
- Added startup session restoration and logout cleanup.
- Ran the mobile TypeScript check successfully under Node 22.23.2.

Tried and abandoned (what didn't work, and why):
- Tried to launch the iOS simulator before editing. `simctl` is unavailable on this machine, so there was no simulator/device to click through.
- Tried Expo web as a fallback. Expo did not expose a reachable local server in this environment, and no in-app browser was available.
- Did not install native storage dependencies because the lane rule forbids agents from running install commands.

Left for next session:
- Install SecureStore with `cd mobile && npx expo install expo-secure-store`, then use it for native token persistence.
- Wire the remaining mobile screens as the API lane publishes list, notes, invoice, notification, verification, and checkout routes.
- Run the app on a real simulator/device and click through login, restart, project detail, logout, and payment flows.

Assumptions made (flag if wrong):
- Until a client-profile route exists, the login user is mapped to the existing mobile `Client` shape with the user's name as the company label.
- `EXPO_PUBLIC_API_URL` is the API origin; it defaults to `http://localhost:3000` for local host testing.

Blockers:
- Native SecureStore dependency is not installed.
- No simulator/device or in-app browser is available in the current environment.
- Root build verification is blocked by a sandbox Turbopack process/port permission error outside `mobile/`.
