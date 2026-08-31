### 2026-08-13 11:18 — Codex — mobile Stripe return contract

Changed:
- Updated `mobile/lib/api.ts` so `POST /api/stripe/checkout` sends
  `{ invoiceId, returnTo: "mobile" }`.
- Left the existing Stripe browser opening, AppState return refresh, invoice
  refetch, and webhook-confirmed `PAID` success gate unchanged.
- Verified the existing Expo scheme is still `clientflow` and the checkout
  route maps to `clientflow://projects/<projectId>/invoices/<invoiceId>/checkout`.

Tried and abandoned (what didn't work, and why):
- No alternate payment or navigation flow was introduced; the requested
  contract change is sufficient and changing the existing flow would risk the
  webhook-confirmed status behavior.

Left for next session:
- The API/payment page should consume `returnTo: "mobile"` and render the
  project/invoice deep link documented in the previous mobile handoff.

Assumptions made (flag if wrong):
- The API accepts the new `returnTo` field exactly as specified by the task and
  uses the existing project and invoice IDs to construct the mobile return URL.

Blockers:
- No code blocker. Physical device/simulator verification remains unavailable
  and was not claimed.
