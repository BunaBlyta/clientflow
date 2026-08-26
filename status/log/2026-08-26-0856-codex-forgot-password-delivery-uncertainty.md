### 2026-08-26 08:56 — Codex — allow registered reset requests through delivery uncertainty

Changed:
- A registered email now receives a successful API response even if Resend reports an error after the reset code has been stored.
- The mobile app can therefore reach code entry for registered users; unknown emails still return the explicit not-registered response.
- Added a regression test for the delivery-error case.

Tried and abandoned (what didn't work, and why):
- Blocking navigation on the email provider's final response kept users on the email screen even when the code had reached the inbox.

Left for next session:
- After deployment, run `cd mobile && npm run ios` and test a registered email, an unknown email, and the resend action from code entry.

Assumptions made (flag if wrong):
- Registration is the required gate, and the user should be allowed to continue when delivery status is uncertain.

Blockers:
- None. Tests pass; this follow-up is ready to commit and push.
