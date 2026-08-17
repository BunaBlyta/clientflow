### 2026-08-17 15:09 — Codex — iOS push notifications

Changed:
- Configured the Expo app for iOS notifications with bundle identifier
  `com.tetbit.clientflow`, the existing EAS project ID, and the notifications
  config plugin.
- Added authenticated device registration calls matching the API seam and a
  native-only coordinator for permission, token rotation, foreground delivery,
  tap/deep-link handling, cold-start handling, and app-resume catch-up.
- Reconciled every push through the existing API and kept notification payloads
  limited to validated IDs and known event types. New-note taps open project
  notes; invoice and project events open their detail screens.
- Made checkout respond to authoritative PAID/FAILED invoice updates while it is
  open.
- Cleared all Zustand domain data on logout/account switch, disabled production
  fixture initialization, and guarded per-resource responses against stale
  overwrites.
- Included the user-installed mobile package lock/package changes and EAS config.

Tried and abandoned (what didn't work, and why):
- No native push test was attempted because no physical iPhone or iOS
  development build was available. Expo web export cannot exercise APNs.
- No mobile test runner was installed, per the repository rule that agents do
  not install packages.

Left for next session:
- Build the iOS development client and verify permission, APNs delivery,
  foreground display, background/terminated tap routing, token rotation, and
  logout unregister against the API.
- Confirm the API agent exposes the exact POST/DELETE device contract in a
  deployed or local environment.

Assumptions made (flag if wrong):
- The EAS project ID already in `mobile/app.json` is the intended project and
  `com.tetbit.clientflow` is the desired iOS bundle identifier.
- Push payload data uses the agreed fields and event type strings; payload text
  remains generic and authoritative entity state is fetched from the API.

Blockers:
- APNs credentials/physical iPhone/development build are still needed for
  end-to-end verification.
