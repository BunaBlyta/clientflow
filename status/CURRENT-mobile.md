# CURRENT — mobile lane (Agent C)

Last updated: 2026-08-24  by Codex — give project notes a mobile chat interface

## Current state

- Reworked the mobile visual system around the web CRM’s restrained direction:
  grey canvas, white bordered panels, neutral list surfaces, hairline
  separators, smaller radii, and no elevation shadows.
- Replaced the earlier blue/cyan treatment with a monochrome accent system:
  black/grey controls and text, with semantic status colors retained only where
  paid, overdue, failed, or project state needs to be scannable.
- Neutralized dark mode’s remaining blue-green cast: the app canvas, cards,
  tab navigation, borders, inputs, and splash background now use true charcoal
  and gray tones. Semantic success, warning, and danger colors remain intact.
- Replaced gradient primary buttons with a flat monochrome fill and simplified
  the auth backdrop to one very subtle neutral detail.
- Standardized app-screen top spacing and removed the repeated in-app
  `CLIENTFLOW` eyebrow so each tab starts with its page heading or greeting.
- Reworked the full project Notes screen into a mobile chat interface: it now
  shows the project context and shared-record hint, renders messages in
  chronological order, groups them under chat-style date separators, keeps
  message times inside each bubble, uses compact bottom-aligned avatars, and
  provides a keyboard-safe composer with native-sized touch targets. Live note
  loading and posting behavior remain unchanged.
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
- `cd mobile && npx expo export --platform web --output-dir /private/tmp/clientflow-mobile-neutral-dark`: passed.
- `cd mobile && npx expo export --platform web --output-dir /private/tmp/clientflow-mobile-notes-ui-v2`: passed.
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
