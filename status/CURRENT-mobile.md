# CURRENT — mobile lane (Agent C)

Last updated: 2026-08-20 14:04 by Codex — align mobile UI with the web CRM

## Current state

- Reworked the mobile visual system around the web CRM’s restrained direction:
  grey canvas, white bordered panels, neutral list surfaces, hairline
  separators, smaller radii, and no elevation shadows.
- Replaced the earlier blue/cyan treatment with a monochrome accent system:
  black/grey controls and text, with semantic status colors retained only where
  paid, overdue, failed, or project state needs to be scannable.
- Replaced gradient primary buttons with a flat monochrome fill and simplified
  the auth backdrop to one very subtle neutral detail.
- Standardized app-screen top spacing and removed the repeated in-app
  `CLIENTFLOW` eyebrow so each tab starts with its page heading or greeting.
- Reworked Home into a web-aligned overview: a personal header, a white
  bordered project-status panel with a muted tracker area, and paid/outstanding
  metrics before the next action.
- Added paid/outstanding summary metrics to the global Invoices tab and removed
  the empty-state description when invoices are already present.
- Added status-colored rails to project rows and kept the project list and
  invoice lists in the web CRM’s dense, quiet table language.
- Kept all routes, API calls, stores, payment behavior, push handling, theme
  switching, language switching, and logout behavior unchanged.

## Verification

- `cd mobile && npx tsc --noEmit`: passed.
- `cd mobile && npx expo export --platform web --output-dir /private/tmp/clientflow-mobile-ui-pass`: passed.
- `git diff --check -- mobile`: passed.
- The in-app browser was unavailable, so there was no screenshot or click-through
  review in this environment.

## Known limits

- The app still needs a real iPhone or simulator review for native spacing,
  tab-bar safe-area behavior, and the SF Pro rendering path.
- The existing `mobile/package.json` script change was left untouched and is not
  part of this UI commit.
- The app still uses fixture-backed request-status UI where the API has no
  public prospect status endpoint.

## API seam

- Mobile sends `{ token, platform: "IOS", appVersion? }` to
  `POST /api/notifications/devices` and `{ token }` to the same endpoint with
  `DELETE`, authenticated with the normal bearer token.
- Push data contains only `notificationId`, `type`, and optional `projectId`,
  `invoiceId`, and `requestId`; the coordinator refetches authoritative data.
- APNs credentials and a physical iPhone/development build are still required
  for end-to-end push proof. Expo Go is not sufficient for remote push.
