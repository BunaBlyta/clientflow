### 2026-08-28 09:17 — Codex — keep checkout handoff neutral

Changed:
- Removed the mobile checkout declined/failed state after the client presses “Continue to secure checkout.”
- Checkout now remains on the same loading screen for authentication, API, Stripe-opening, polling, and non-paid invoice-status outcomes.
- Preserved the confirmed Stripe-backed `PAID` transition to the payment success screen and the existing back button as the way to leave a stalled handoff.

Tried and abandoned (what didn't work, and why):
- Nothing.

Left for next session:
- Spot-check the handoff on a device by trying an open, failed, and already-paid invoice.

Assumptions made (flag if wrong):
- “No matter the status of the invoice” means every non-paid state remains visually neutral after the button press; confirmed payment may still show success.

Blockers:
- `npm run verify` stops during root lint on pre-existing web-owned errors in `components/dashboard/date-picker.tsx` and `components/dashboard/settings-content.tsx`.
- No physical device or simulator was available for a tap-through check.
