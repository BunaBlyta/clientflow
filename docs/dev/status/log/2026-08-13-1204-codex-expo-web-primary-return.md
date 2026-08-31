### 2026-08-13 12:04 — Codex — Expo web primary payment return

Changed:
- Changed valid mobile payment results to use “Continue to web app” as the primary
  action.
- The action opens the fixed Expo web route at
  `http://localhost:8081/projects/<projectId>/invoices/<invoiceId>/checkout`.
- Removed the native `clientflow://` action component from the payment-result flow
  while native builds are deferred.
- Kept invalid or incomplete mobile parameters and normal web payments on
  `/dashboard/invoices`.
- Kept the success-page wording explicit that Stripe webhook confirmation is the
  source of the paid status.

Tried and abandoned (what didn't work, and why):
- `APP_URL` is established for the Next/API origin, not the Expo web server, so it was
  not reused for this route. No established Expo web URL variable exists; the page
  uses the requested localhost fallback.

Left for next session:
- Revisit native `clientflow://` return support after Xcode/native builds are available.

Assumptions made (flag if wrong):
- The Expo web server uses the existing route without the `(app)` group in its URL.
- Local development exposes Expo web on port 8081 as requested.

Blockers:
- Native deep-link testing was not performed. The temporary Expo web route returned
  HTTP 200 when verified against the running local Expo server.
