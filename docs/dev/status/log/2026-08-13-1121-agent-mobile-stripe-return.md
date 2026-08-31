### 2026-08-13 11:21 — API agent — mobile Stripe return flow

Changed:
- Added the allowlisted `returnTo: "mobile"` option to the Stripe checkout API.
- Mobile success URLs now carry the Stripe session placeholder plus the
  project and invoice IDs needed by the payment return flow.
- Preserved the existing web success URL and checkout response shape.
- Made session reuse mode-aware: web sessions reuse normally, while mobile
  only reuses a Stripe session whose success URL matches the Clientflow mobile
  path and the same invoice/project. Old web-only sessions get a fresh mobile
  session.
- Added focused tests for authentication, client ownership, invoice-state
  responses, URL construction, invalid return modes, and both reuse paths.
- Documented the final API contract in `docs/ARCHITECTURE.md`.

Tried and abandoned (what didn't work, and why):
- No implementation approach was abandoned. The aggregate Turbopack build
  still cannot fetch Inter from Google Fonts in this sandbox; the required
  webpack build passed.

Left for next session:
- The mobile lane should request `returnTo: "mobile"` when it wires its
  checkout call, then verify its existing webhook-confirmed invoice refresh.

Assumptions made (flag if wrong):
- `returnTo` is a mode, not a URL. Only the literal `mobile` mode is accepted,
  and all destination fields are derived from the authenticated invoice and
  its project.
- A mobile caller should not reuse an existing session unless Stripe returns a
  matching Clientflow mobile success URL for that invoice and project.

Blockers:
- None for the API implementation. `npm run verify` is limited only by the
  sandbox's external Google Fonts fetch restriction; `npx next build --webpack`
  passed.
