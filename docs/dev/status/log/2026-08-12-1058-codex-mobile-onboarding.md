### 2026-08-12 10:58 — mobile lane — wire real onboarding auth

Changed:
- Added API helpers for verification send, verification check, and set-password.
- Replaced the demo verification-code timer and fixture imports with real API
  calls, including a real resend request.
- Passed the verification code through the route to set-password so the same
  code can be checked first and consumed only by set-password.
- Wired forgot-password to request a real reset code.
- Refactored login session persistence into a shared `startSession` action and
  used it after set-password so invite and reset flows auto-login directly to
  the projects screen.

Tried and abandoned (what didn't work, and why):
- No timer-based fallback remains. It could make the screens appear to work
  without a real account or code, which hid the code-consumption bug.

Left for next session:
- Buna should click the full approval email → verify → set password → projects
  flow against the real API and confirm the reset variant as well.

Assumptions made (flag if wrong):
- The `{ user, token }` response from set-password is interchangeable with the
  existing login response, as documented in `docs/ARCHITECTURE.md`.
- The projects route at `/projects` is the correct authenticated landing route;
  the root redirect confirms that route.

Blockers:
- Device and simulator testing remains with Buna; no compatible Expo Go or
  Xcode environment is available to this lane.
