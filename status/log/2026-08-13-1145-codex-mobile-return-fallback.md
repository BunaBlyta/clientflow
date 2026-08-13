### 2026-08-13 11:45 — Codex — mobile Stripe return fallback

Changed:
- Added a client-side mobile return action for the Stripe success page that attempts
  the existing `clientflow://projects/<projectId>/invoices/<invoiceId>/checkout`
  scheme.
- Added visibility-based failure detection and a clear fallback to the web invoices
  page when the browser remains open after the custom-scheme attempt.
- Explained that Expo web cannot handle the native scheme and that a native
  Clientflow build must be installed for the app return to work.
- Inspected `mobile/app.json` and Expo Router's project/invoice checkout route. The
  scheme and route are present, so no mobile source edit was required.

Tried and abandoned (what didn't work, and why):
- Relying on the server-rendered custom-scheme anchor alone was insufficient: an
  ordinary browser or Expo web has no native handler and can leave the page looking
  unchanged. The page now handles the attempt and gives the user a visible route
  forward.

Left for next session:
- Test the full return on a real device or simulator with a native Clientflow build.

Assumptions made (flag if wrong):
- The API-provided project and invoice IDs and the existing `clientflow` scheme are
  the correct native route inputs; the API contract and mobile code were not changed.

Blockers:
- Native-device or simulator testing was unavailable, so native deep-link opening is
  not claimed as verified. Web checks and the webpack production build pass.
