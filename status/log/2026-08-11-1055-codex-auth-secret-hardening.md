### 2026-08-11 10:55 — Codex — auth secret hardening

Changed:
- Made missing `SESSION_SECRET` a module-load error in production.
- Renamed the local fallback to make clear it is development-only and added a
  warning whenever it is used.
- Added a generated `SESSION_SECRET` to the ignored local `.env` and documented
  the required Vercel setting in `docs/ARCHITECTURE.md`.
- Added a wrong-secret Vitest test and made scrypt cost parameters explicit in
  both auth verification and seed password generation.

Tried and abandoned (what didn't work, and why):
- Full `npm run verify` still cannot complete its build because the sandbox
  prevents Turbopack from binding its internal process during CSS processing.
  This is the same environment failure recorded in earlier backend checkpoints.

Left for next session:
- Wire a frontend screen to the now-hardened login and project routes.

Assumptions made (flag if wrong):
- The development fallback remains useful for local route work, but it is never
  acceptable for a production deployment.
- The explicit scrypt settings preserve the Node defaults used by existing seed
  hashes.

Blockers:
- Production build verification remains blocked by the environment's Turbopack
  port-binding restriction.
