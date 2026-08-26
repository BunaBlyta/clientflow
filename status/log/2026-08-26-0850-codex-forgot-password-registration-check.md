### 2026-08-26 08:50 — Codex — distinguish registered and unregistered reset emails

Changed:
- The verification-send API now returns 404 for an email that is not in the CRM instead of pretending it sent a code.
- The mobile reset screen shows a localized “not registered” warning for that 404 and navigates to code entry for registered users.
- Added coverage for both unknown and registered email requests and documented the changed API contract.

Tried and abandoned (what didn't work, and why):
- The previous generic-success behavior was unsuitable for this product flow because users need to know when an email is not registered.

Left for next session:
- Rebuild/run the iOS app with `cd mobile && npm run ios` and test one CRM email and one random email.

Assumptions made (flag if wrong):
- Account enumeration is acceptable here because the requested UX explicitly distinguishes registered from unregistered emails.

Blockers:
- None. Changes remain uncommitted and unpushed by request.
