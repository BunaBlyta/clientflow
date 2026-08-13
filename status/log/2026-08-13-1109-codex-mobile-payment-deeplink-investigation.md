### 2026-08-13 11:09 — Codex — mobile Stripe return-link investigation

Changed:
- Traced the mobile checkout screen and helper, the `POST /api/stripe/checkout`
  response, Stripe's `success_url`, the web payment success page, and Expo
  Router's `clientflow://` handling.
- Confirmed the mobile app already refreshes the invoice when the browser
  returns and only displays success after a live `PAID` response.
- Confirmed Expo Router SDK 57 can route a `clientflow://projects/<projectId>/invoices/<invoiceId>/checkout`
  link to the existing checkout screen because the app already declares the
  `clientflow` scheme and the route exists.

Tried and abandoned (what didn't work, and why):
- A mobile-only label or navigation change cannot fix the reported behavior:
  the browser is sent to a web success page whose link is hardcoded to the
  staff dashboard. The mobile app cannot intercept that web page link.
- No mobile source change was made because the server/payment-page contract is
  insufficient and the task explicitly forbids editing those owner lanes.

Left for next session:
- Buna/API lane: extend `POST /api/stripe/checkout` with an explicit mobile
  return mode, for example `{ invoiceId, returnTo: "mobile" }`. For that mode,
  keep Stripe's HTTP success page but include the project and invoice IDs in
  its query parameters alongside `session_id={CHECKOUT_SESSION_ID}`.
- Buna/web lane: when `returnTo=mobile`, render a link to
  `clientflow://projects/<projectId>/invoices/<invoiceId>/checkout` instead of
  `/dashboard/invoices`; retain the dashboard link for ordinary web checkout.
  The mobile checkout should then send the new return mode and preserve its
  existing AppState refresh and webhook-confirmed `PAID` gate.

Assumptions made (flag if wrong):
- The existing checkout screen is the intended return destination because its
  current AppState listener owns the invoice refresh and confirmation UI.
- A server-selected return mode is safer than accepting an arbitrary redirect
  URL from the client and avoids changing Stripe's webhook/payment truth.

Blockers:
- The required API route and web payment success page are outside the mobile
  lane. No implementation can make the “View invoices” button return to the
  app until those owners add the mobile return contract.
