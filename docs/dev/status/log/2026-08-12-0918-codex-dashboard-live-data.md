### 2026-08-12 09:18 — Codex — dashboard live data

Changed:
- Replaced mock invoice and project reads on the overview and analytics screens with authenticated API reads and added loading/error states.
- Replaced mock clients, totals, notifications, topbar notifications, and project package labels with live API data.
- Converted the project request table to the available request and package APIs, including real approve/reject PATCH actions.
- Disabled notification read controls and resend invitations because their write endpoints are not available.
- Added a shared authenticated no-store JSON fetch helper.

Tried and abandoned (what didn't work, and why):
- The required in-app browser click-through could not start because the browser runtime reported no available backends. No narrow or wide visual claim is recorded.
- The required Turbopack build could not bind its sandbox process/port; the webpack build passed instead.
- The final `npm run verify` run exposed six API-lane test failures caused by Prisma mocks that do not cover the newer transaction and notification behavior; web typecheck and lint still passed.

Left for next session:
- Re-run signed-in narrow and wide browser QA when a browser backend is available.
- Enable notification read controls after `PATCH /api/notifications/[id]` ships.
- Replace the seeded topbar identity after `GET /api/auth/me` ships.

Assumptions made (flag if wrong):
- The available `GET /api/requests`, request PATCH, and `GET /api/packages` routes are the intended live sources for the existing request tab and overview pending list.
- The API's serialized invoice amounts are cents and the project package price is major currency units, matching the existing frontend types and serializers.

Blockers:
- Browser runtime has no available backend in this environment, so browser click-through remains outstanding.
