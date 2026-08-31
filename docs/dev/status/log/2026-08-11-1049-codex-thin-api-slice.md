### 2026-08-11 10:49 — Codex — thin API slice

Changed:
- Added and applied the `Project.targetLaunchDate` migration, updated the seed
  dates, and reseeded Neon.
- Added the signed stateless session helper. Login sets an HTTP-only cookie and
  returns the same token for Expo's bearer-token flow.
- Added only `POST /api/auth/login` and `GET /api/projects/[id]`. The project
  route keeps the response flat, serializes dates as ISO strings, and prevents a
  client from reading another client's project.
- Recorded the session decision and both response contracts in
  `docs/ARCHITECTURE.md`.
- Verified the real seeded flow. Login returned a staff user and token; fetching
  `proj-1` returned:
  `{"id":"proj-1","clientId":"client-1","packageId":"pkg-full-website","name":"Riverside Cafe — Full Website","status":"DEVELOPMENT","createdAt":"2026-06-02T14:00:00.000Z","updatedAt":"2026-08-05T09:30:00.000Z","targetLaunchDate":"2026-09-15T00:00:00.000Z"}`

Tried and abandoned (what didn't work, and why):
- The first project request returned no target date because it was made before
  the updated seed ran after the migration. Rerunning the idempotent seed fixed
  the data, and the second real request returned the date.
- Full verification's build still fails in the execution environment because
  Turbopack cannot bind its internal process during CSS processing. Typecheck,
  lint, and tests pass.

Left for next session:
- Wire the first frontend screen to the new live routes, then continue with the
  remaining API surface.

Assumptions made (flag if wrong):
- Staff can read any project; clients can read only projects linked to their
  Client record.
- The development fallback session secret is acceptable locally; production
  should set `SESSION_SECRET` explicitly.

Blockers:
- Production build verification remains blocked by the environment's Turbopack
  port-binding restriction. Existing unrelated frontend changes remain
  uncommitted and were not staged.
