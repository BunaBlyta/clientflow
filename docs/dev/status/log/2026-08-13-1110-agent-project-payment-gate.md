### 2026-08-13 11:10 — API agent — project payment-gate enforcement

Changed:
- Added an API-level conflict guard to the staff project status endpoint. A
  standard project that is still `PENDING` now needs its initial `DEPOSIT`
  invoice to be exactly `PAID` before staff can move it to another phase.
- Rejected manual `PENDING → DISCOVERY` in all cases. The verified Stripe
  webhook remains the only code path that performs that transition.
- Kept normal manual changes available once a project is already in Discovery
  or a later phase, and preserved custom projects' existing manual behavior.
- Added route tests for the payment gate, manual Discovery rejection, custom
  projects, later phases, and authentication/authorization.
- Documented the rule in `docs/ARCHITECTURE.md`.

Tried and abandoned (what didn't work, and why):
- The normal `next build` path could not fetch Inter from Google Fonts in the
  sandbox. The webpack fallback completed successfully, so no code change was
  made for that environment-only failure.

Left for next session:
- No follow-up is required for this task. Buna should still exercise the
  payment-gated project row against the deployed database if desired.

Assumptions made (flag if wrong):
- `DEPOSIT` is the payment-gated invoice type because request approval creates
  `DEPOSIT`/`SENT` and the Stripe webhook advances only for `DEPOSIT`.
  Custom conversion creates `CUSTOM` invoices and therefore keeps its existing
  manual non-Discovery behavior.

Blockers:
- None for the implementation. The normal Turbopack build remains blocked only
  by the sandbox's external Google Fonts fetch restriction; the webpack build
  passed.
