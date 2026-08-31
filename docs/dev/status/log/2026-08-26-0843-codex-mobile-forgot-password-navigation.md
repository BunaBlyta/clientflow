### 2026-08-26 08:43 — Codex — fix mobile forgot-password navigation

Changed:
- Separated the verification-email request from the Expo Router transition in the mobile forgot-password screen.
- Changed the transition to Expo Router's explicit pathname-and-params form so a delivered code opens the six-digit code screen.

Tried and abandoned (what didn't work, and why):
- No alternative implementation was needed; the code-entry screen and resend action already existed.

Left for next session:
- Run `cd mobile && npm run ios` and test with a real delivered code.

Assumptions made (flag if wrong):
- The email delivery succeeded and the visible failure was caused by the transition being caught as though it were an email error.

Blockers:
- None. Mobile TypeScript check passed.
