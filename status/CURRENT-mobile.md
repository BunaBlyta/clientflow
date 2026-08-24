# CURRENT — mobile lane (Agent C)

Last updated: 2026-08-24 13:35 by Codex — animate mobile origin back transition

## What changed

- Fixed the custom back buttons on project and invoice detail screens opened from Invoices or Notifications. The native project stack no longer intercepts back actions with an unreliable `beforeRemove` listener; the visible origin button now animates the detail screen out before returning to its source tab.
- Detail screens opened from Projects still use the normal native stack back behavior.

## Verification

- `npx tsc --noEmit` passed from `mobile/`.
- `npx expo export --platform ios --output-dir /private/tmp/clientflow-mobile-ios-smooth-origin` passed.

## Current state

- Removed the native bottom-tab shift animation after it intermittently left the Notifications tab on a blank screen; tab changes now use the stable default mounting path, while project-detail stack slides remain enabled.
- Set tab and project-stack scene backgrounds to the active theme canvas, removing the white transition flash that appeared in dark mode while preserving native motion.
- Kept the tab shift and project slide animations on native platforms but disabled navigator animations on web, fixing the blank Notifications scene and white flash during web tab switching.
- Added subtle motion to tab switching and cross-tab back navigation: tabs shift over 180ms, project-stack screens slide from the right, and origin returns dismiss toward the source tab instead of hard-replacing it.
- Preserved the originating tab when opening project or invoice details from Invoices or Notifications. Their custom back action and native back handling now return to the source tab instead of stopping inside the project stack.
- Added a localized note count to the Notes card footer, matching the invoice count treatment and excluding system audit entries from the total.
- Added restrained hairline separators beneath the Notes and Invoices card headers, plus footer rules before the trailing Notes/Invoices content, so both project-detail cards have clearer structure without changing their surfaces.
- Hardened invoice rows against narrow-screen clipping by removing the unnecessary overflow constraint and explicitly allowing the invoice text column to shrink within the icon, amount, status, and chevron layout.
- Brightened the project-detail studio note preview bubble further by using the accent-soft surface, making the dark-mode contrast more obvious while keeping light mode darker than the white card.
- Adjusted studio-authored note bubbles in the project detail preview to use the muted surface, making them darker against light cards and lighter against dark cards; full notes and client-authored bubbles are unchanged.
- Changed the Projects tab header to show only “Projects,” matching the plain headings used by Invoices and Notifications instead of greeting the client by name.
- Lowered the home screen greeting slightly and increased “Hi Jordan” from 26px to 28px for a more relaxed, prominent header.
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
- Replaced the plain stacked theme and language rows in Account with more
  expressive controls: an icon-based system/light/dark selector and compact
  language cards with EN/SQ/DE code badges and a clear selected state. The
  existing theme persistence and language switching behavior are unchanged.
- Reworked Home into a web-aligned overview: a personal header, a white
  bordered project-status panel with a muted tracker area, and paid/outstanding
  metrics before the next action.
- Added paid/outstanding summary metrics to the global Invoices tab and removed
  the empty-state description when invoices are already present.
- Added status-colored rails to project rows and kept the project list and
  invoice lists in the web CRM’s dense, quiet table language.
- Kept all routes, API calls, stores, payment behavior, push handling, theme
  switching, language switching, and logout behavior unchanged.
- Fixed the shared mobile screen wrapper to use the native top safe area instead
  of asking each tab to calculate notch spacing independently. Removed duplicate
  top-inset overrides from Notifications and Account so tab titles and subtitles
  begin below the iPhone notch consistently.
- Notifications now refetch whenever the Notifications tab regains focus, so a
  client does not need to restart the native app after staff sends an invoice.
- Added an in-app notification banner for native clients. While the app is
  active, it shows newly arrived realtime notifications with tap-through to the
  related invoice or project. This does not require Apple push credentials.
- Replaced the active-app polling banner trigger with a true Ably Realtime
  subscription to the authenticated client's own user channel. Incoming
  `notification.created` messages are validated, merged into the inbox
  immediately, and trigger related invoice/project/note refreshes. The existing
  app-resume and tab-focus refreshes remain as recovery paths for missed events.
- Added the mobile `ably` dependency and the bearer-authenticated realtime-token
  API helper. The private Ably API key remains server-only.

## Verification

- `cd mobile && npx tsc --noEmit`: passed after the safe-area change.
- `cd mobile && npx expo export --platform web --output-dir /private/tmp/clientflow-mobile-notifications-safe-area`: passed.
- `git diff --check -- mobile`: passed after the safe-area change.
- `cd mobile && npx tsc --noEmit`: passed after the focus-refresh change.
- `cd mobile && npx expo export --platform web --output-dir /private/tmp/clientflow-mobile-notification-focus`: passed.
- `git diff --check -- mobile`: passed after the focus-refresh change.
- `cd mobile && npx tsc --noEmit`: passed after the in-app banner change.
- `cd mobile && npx expo export --platform web --output-dir /private/tmp/clientflow-mobile-in-app-notifications`: passed.
- `git diff --check -- mobile`: passed after the in-app banner change.
- `cd mobile && npx tsc --noEmit`: passed after the Ably subscription change.
- `cd mobile && npx expo export --platform web --output-dir /private/tmp/clientflow-mobile-ably-realtime`: passed.
- `git diff --check -- mobile`: passed after the Ably subscription change.
- The in-app browser was unavailable, so there was no screenshot or click-through
  review in this environment.

## Known limits

- The app still needs a real iPhone or simulator review for native spacing,
  tab-bar safe-area behavior, and the SF Pro rendering path.
- Invoice-issued notifications are intentionally delivered to the client linked
  to the invoice. A staff session should see the invoice table refresh, but not
  a new inbox notification for sending its own invoice.
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
- Ably realtime is foreground-only by nature of the in-app banner. Background
  and closed-app alerts still require Apple push credentials.
