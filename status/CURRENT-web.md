# CURRENT — web UI lane (Agent B)

Last updated: 2026-08-18 10:31 by Codex — align request fields with warning rows

## Current state

- Explicitly removed the accidental dark gradient strip from the light-mode request-modal title and modal surface. Light-mode modal fields now use a clearly visible light blue-gray fill with no outer border or focus shadow; required-field asterisks and inline empty-field labels use a deeper teal-blue with an alert icon in a fixed-height label row above the field, so validation does not move or misalign the textboxes; dark mode is unchanged.
- Applied the PM landing-page pass: buttons keep their position and use a hand cursor, header is solid, anchor navigation scrolls smoothly with a sticky-header offset, and the hero copy is constrained into a centered triangular wrap.
- Added intentional three-line breaks to the English landing hero headline so its centered lines widen toward the base; preserved the same spacing behavior through the locale system.
- Made the landing header’s language, theme, login, and navigation controls use one pill radius, equal control gaps, and consistent language-menu padding.
- Removed the language menu item’s extra right-side reservation so its padding is even on all sides.
- Removed the compact language menu’s shared minimum width so it now fits its longest language label plus the intended padding.
- Added a subtle lighter background and text treatment for the currently selected language in light and dark mode.
- Removed the compact menu’s selected checkmark and aligned the menu’s right edge to the trigger so it opens leftward.
- Removed the package-card top bars, gave the Most Popular CTA a distinct blue treatment, and kept every package description in a two-line slot.
- Added a concise second sentence to each landing package description so the reserved two-line treatment contains real copy.
- Removed the dark Most Popular card border, made its badge a circular angled mark in both themes, and added a soft top-right light wash in dark mode.
- Reduced the dark card’s cyan highlight and shadow intensity so the surface stays substantially darker.
- Darkened the Most Popular card to an almost-black blue cast, just slightly distinct from the other black cards.
- Increased the dark Most Popular corner gradients so they are visible on black and matched the custom card border opacity to the standard card.
- Standardized landing section spacing and button radii/gaps. The “How it works” steps and connectors keep their original hover animations without moving buttons or changing section layout.
- Differentiated package cards with aligned content rows, distinct standard/popular/custom shades, and a clearer popular treatment.
- Package requests and custom builds now open dialogs, and the visible custom inquiry form is also restored in the Contact section. Required fields show asterisks, submission errors appear at the top with an alert icon, dropdowns open below and align to the field, and long textareas stay bounded and resizable.
- Tightened package cards to a 320px minimum height and clamp package descriptions to two rows so card content stays aligned without excessive vertical space.
- Kept the custom web app heading aligned to the form top and added a little more space before its description.
- Removed the custom package price color, enlarged the Popular badge, and scoped “How it works” hover animations to the icon itself so the step layout stays still.
- Fixed every package description to a two-line, 40px slot and added subtle on-theme cyan surface/top-accent differences for each card.

- Added one dashboard-level `DashboardRealtimeProvider`. It authenticates to
  `GET /api/realtime/token`, subscribes to `clientflow:user:<id>` and
  `clientflow:staff`, and listens for `notification.created` and
  `entity.changed` messages.
- Added a dedicated Zustand notification store in
  `lib/realtime-notification-store.ts`. The store owns the shared list,
  loading/error state, connection state, authoritative read actions, merge and
  deduplication behavior, and cross-tab read synchronization.
- Consolidated the topbar bell and the notifications page onto that store, so
  both surfaces show the same live list and unread count. New remote records
  produce one toast; duplicate events and initial/reconnect catch-up do not.
- Realtime entity events are treated as refetch hints only. Debounced browser
  events refresh the overview, analytics, invoice list, project list, and the
  matching project detail page through their existing API loaders. Invoice and
  payment state remains server-authoritative.
- The provider catches up on initial load, Ably reconnect, window focus,
  visibility changes, and explicit refresh. It polls notifications every 30
  seconds only while the connection is degraded.
- Added Node-friendly pure tests for notification sorting, ID deduplication,
  canonical payload validation, and entity-event validation.
- Hardened snapshot reconciliation: an older in-flight notifications GET can no
  longer erase a newer Ably notification already merged into the store. Server
  records still win when the same ID appears in both collections.
- Fixed the provider startup ordering: Ably channels attach before the first
  notification snapshot, then the GET runs as an authoritative catch-up. This
  closes the window where a notification could be created after the initial
  GET but before subscription and otherwise require a manual refresh.
- Added sanitized console diagnostics for token authentication failures,
  startup/attachment failures, and degraded Ably connection states. Logs never
  include token payloads or API credentials.
- Added `request` to the web entity-event guard. The overview now refetches its
  pending-request data when a new request event arrives instead of leaving the
  request list stale while the bell updates.
- Added a restrained recent-notifications activity section to the overview,
  backed by the shared Zustand store. New invoice, payment, status, note, and
  request notifications therefore appear on the dashboard as soon as the
  realtime event is merged.

## Verification

- `npm run typecheck && npm run lint`: passed; lint retains two pre-existing image warnings in `components/marketing/mobile-app-section.tsx`.
- `npm run verify`: typecheck, lint, and 172 tests passed; the default Turbopack build hit the known sandbox process/port-binding panic.
- `node_modules/.bin/next build --webpack`: passed.
- `npx vitest run lib/realtime-notification-store.test.ts`: passed (4 tests).
- `npm run typecheck`: passed after the API lane's generated Prisma client was
  refreshed.
- `npm run lint`: passed with two pre-existing warnings in
  `components/marketing/mobile-app-section.tsx` for raw `<img>` elements.
- `git diff --check`: passed for web-owned changes.
- `npm run typecheck`: passed. The earlier API-lane Prisma generation and
  Stripe narrowing blockers have cleared.

## Handoff notes

- The API lane must keep `GET /api/realtime/token` returning a direct Ably
  TokenRequest (or a `{ tokenRequest }`/`{ tokenDetails }` wrapper) and grant
  staff subscribe capability to both the per-user and `clientflow:staff`
  channels. The provider accepts either direct or wrapped token responses.
- `notification.created` should carry the existing web `Notification` shape:
  `id`, `userId`, `type`, `title`, `body`, `read`, `createdAt`, and optional
  `projectId`, `invoiceId`, `requestId`.
- `entity.changed` should carry `entity`, `reason`, and the relevant project
  and/or invoice IDs. Payload state is deliberately not applied directly.
- Ably and API changes from other lanes are intentionally not included in the
  web commit. Do not edit `STATUS.md` or another lane's status file.
