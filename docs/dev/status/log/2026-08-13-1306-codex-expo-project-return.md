### 2026-08-13 13:06 — Codex — Expo project return redirect

Changed:
- Updated valid mobile Stripe success returns to open
  `http://localhost:8081/projects/<projectId>` instead of the invoice checkout route.
- Kept the “Continue to web app” label, normal `/dashboard/invoices` fallback, and
  webhook-confirmation wording.
- Kept the invoice ID out of the destination path so Expo can hydrate the project
  before the client opens an invoice.

Tried and abandoned (what didn't work, and why):
- No API or mobile source change was needed; this was a redirect-only change in
  `app/payment/success/page.tsx`.

Left for next session:
- Revisit native deep-link support after Xcode/native builds are available.

Assumptions made (flag if wrong):
- The existing Expo web project route is the correct hydrated landing screen after
  payment.

Blockers:
- Native deep-link testing was not performed. The exact Expo project URL returned
  HTTP 200 when verified against the running local Expo server.
