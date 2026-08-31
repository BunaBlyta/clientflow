### 2026-08-13 11:54 — Codex — Expo web payment return fallback

Changed:
- Added an explicit “Open Expo web app” action to the mobile Stripe success result
  when the result page is running on `localhost` or `127.0.0.1`.
- The action uses the fixed local URL
  `http://localhost:8081/projects/<projectId>/invoices/<invoiceId>/checkout` built
  from the existing validated query parameters.
- Kept the native `clientflow://` attempt, the `/dashboard/invoices` fallback, and
  the webhook-confirmed payment wording intact.
- Documented that the localhost action is development-only and does not establish
  native deep-link support in production.

Tried and abandoned (what didn't work, and why):
- No mobile or API changes were needed. The existing Expo web route already matches
  the requested path, so changing the mobile router would have expanded scope without
  addressing the browser's inability to handle the custom native scheme.

Left for next session:
- Test the native `clientflow://` return on a real device or simulator with an
  installed native build.

Assumptions made (flag if wrong):
- The development Expo web server is reachable at the explicitly requested
  `http://localhost:8081` origin.
- Expo web uses the existing route without the `(app)` group in its URL.

Blockers:
- Native-device or simulator testing was unavailable. The native deep link remains
  unverified; web checks and the webpack production build pass.
