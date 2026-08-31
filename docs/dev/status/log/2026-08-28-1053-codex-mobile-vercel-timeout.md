### 2026-08-28 10:53 — Codex — verify mobile Vercel API availability

Changed:
- Confirmed the mobile environment already uses the URL supplied by Buna.
- Direct requests to the Vercel site and `/api/realtime/token` timed out after
  20 seconds, so the deployment origin is not currently responding.

Tried and abandoned (what didn't work, and why):
- Changing `mobile/.env` was not useful because it already contained the same
  URL and the URL itself is the failing part.

Left for next session:
- Inspect Vercel deployment/domain status and runtime logs, then redeploy or
  replace the mobile API origin with the active production URL.

Assumptions made (flag if wrong):
- The timeout reflects the current deployment or domain state rather than a
  transient network block specific to the mobile app.

Blockers:
- No Vercel deployment-management access is available in this workspace, so
  the unavailable deployment cannot be repaired from the repository alone.
