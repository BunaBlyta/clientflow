### 2026-08-26 13:09 — Codex — diagnose iOS login failure

Changed:
- Updated the mobile login screen so HTTP 401 responses still show the localized invalid-credentials message, while development builds log the underlying transport/server error. This makes an unreachable API distinguishable from a wrong password.
- Preserved the existing translated brand label change already present in the login file.

Tried and abandoned (what didn't work, and why):
- A read-only request to the configured Vercel host timed out from this environment, so deployment reachability could not be confirmed here. No login credentials were sent.
- `npm run ios -- --no-install` could not launch because the local CoreSimulator/Device Hub service is unavailable.

Left for next session:
- Run the iOS app on a working simulator or physical device. If the UI says “Something went wrong,” read the Metro/Xcode warning beginning `[Clientflow] login request failed:`; it will identify whether the deployment is unreachable or returning a server error.

Assumptions made (flag if wrong):
- `EXPO_PUBLIC_API_URL=https://clientflow-ijdn.vercel.app` is the intended deployed API origin. The iOS export confirmed Expo loaded that environment variable.

Blockers:
- This machine cannot launch an iOS simulator, and outbound access to the configured deployment timed out, so the final click-through could not be completed here.
