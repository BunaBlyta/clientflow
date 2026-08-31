### 2026-08-17 15:35 — Codex — harden Expo token rotation

Changed:
- Corrected mobile token rotation so `addPushTokenListener` only triggers a
  fresh `getExpoPushTokenAsync({ projectId })` exchange. The native APNs token
  emitted by that listener is no longer passed to the API as an Expo token.
- Updated the mobile lane state file with the corrected behavior.

Tried and abandoned (what didn't work, and why):
- No mobile test file was added because the mobile package has no test runner
  configured and installing one is outside this lane's authority.

Left for next session:
- Verify token rotation on a physical iPhone development build and confirm the
  API receives an `ExponentPushToken[...]` value after the native token changes.

Assumptions made (flag if wrong):
- The existing API contract continues to accept Expo push tokens in the
  `token` field and treats repeated POSTs as an upsert.

Blockers:
- Physical iPhone/APNs credentials remain required for native token testing.
