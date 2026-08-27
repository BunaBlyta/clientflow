### 2026-08-27 11:01 — Codex — diagnose mobile login API reachability

Changed:
- Confirmed the mobile login request targets `/api/auth/login` and that the shown warning represents a transport failure before an HTTP response, not invalid credentials.
- Confirmed `EXPO_PUBLIC_API_URL` is currently `https://clientflow-ijdn.vercel.app` in the local mobile environment.
- Direct reachability checks to that host timed out, while a control request to `vercel.com` responded.

Tried and abandoned (what didn't work, and why):
- Searched the repository and git history for a newer deployment URL; none is recorded.
- No code or dependency change was made because the missing/unavailable deployment origin cannot be inferred safely from the repository.

Left for next session:
- Replace the mobile `EXPO_PUBLIC_API_URL` value with the current Vercel production URL, then restart Metro with `npx expo start -c`; rebuild an installed EAS/dev build if the app is not running from Metro.

Assumptions made (flag if wrong):
- `clientflow-ijdn.vercel.app` is stale or unavailable rather than temporarily blocked only from this machine.

Blockers:
- The current Vercel project URL is not present in the checkout, and no deployment-management credential is available to discover it.
