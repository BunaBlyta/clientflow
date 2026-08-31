### 2026-08-13 11:54 — Codex — Expo web payment return route verification

Changed:
- Verified `GET http://localhost:8081/projects/proj-1/invoices/inv-1/checkout`
  returns the Expo web app shell.
- Inspected the generated Metro web bundle and confirmed it includes
  `app/(app)/projects/[id]/invoices/[invoiceId]/checkout.tsx` for the exact
  `/projects/<projectId>/invoices/<invoiceId>/checkout` web path.
- Confirmed the bundled checkout screen still calls `refreshInvoice` after an
  AppState return and only changes to success when the fetched invoice status
  is `PAID`.
- Confirmed the existing `clientflow` scheme and native deep-link route remain
  unchanged.

Tried and abandoned (what didn't work, and why):
- Interactive in-app browser inspection was unavailable in this session. The
  route was verified through the running Expo server response and generated
  web bundle instead; no physical-device or simulator testing was claimed.
- No routing/configuration edit was made because the route already resolved
  correctly in Expo web mode.

Left for next session:
- The web payment page can use this HTTP fallback URL on port 8081 during local
  Expo-web testing while retaining `clientflow://` for native builds.

Assumptions made (flag if wrong):
- An authenticated Expo-web session is available when the fallback URL is
  opened; the route's existing auth guard remains responsible for redirecting
  unauthenticated visitors to login.

Blockers:
- The in-app browser was unavailable, so no interactive screen rendering was
  performed in this session.
