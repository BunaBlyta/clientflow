# CURRENT — web UI lane (Agent B)

Last updated: 2026-08-18 19:36 by Codex — remove duplicate locale keys blocking deploy

## Current state

- Added Analytics Project aging scatter and Upcoming receivables calendar heatmap charts, using active project update age and unpaid invoice due dates to surface operational risk and cash timing. Added visible age/color legends, month labels, heatmap day numbers, today highlighting, timezone-safe local date keys, matched chart-area proportions, corrected the aging chart’s axis frame, moved both legends to the top-right, removed the scatter plot’s max-width constraint, kept its day domain responsive to the rendered card width, made the existing receivables heatmap weeks stretch across wider cards, added click-through details for projects and receivable invoices, kept the chart area at full height while selection details expand the card downward, made double-clicking a receivables day clear its selection, added larger aging point hit areas with reliable toggle clearing, let the generated AI insight span the entire card below the header row, split Overview average-turnaround rows into even name/value columns, kept all packages with no launches visible as “No launches,” restored the three-package turnaround row at large widths, matched Work Queue row height and spacing to the neighboring Overview cards, and removed duplicate German and Albanian translation keys that were failing Vercel’s TypeScript build.

- Replaced the Overview Notifications/invoice activity card with a localized Project schedule, showing every active project with dated launches first and “Not scheduled” for projects without a target date; the existing two-column layout and responsive whole-row limit remain.

- Kept Recent Projects and Notifications on a shared fixed 56px row rhythm so corresponding rows line up without stretching their cards beyond the actual content; notification content is vertically centered to match. Both panels now calculate a shared whole-row limit from the viewport height, so the last visible row is never clipped.

- Softened Analytics card, table, and chart separators with a page-scoped lower-contrast border token, keeping the structure visible without bright lines dominating on lighter or higher-contrast displays.

- Made the Overview viewport-height-aware on larger screens so the Recent Projects and Notifications cards stretch together through the remaining available space. Their visible row counts now respond to viewport height rather than width, with fewer rows on shorter screens and no panel scrollbar.

- Added a full-width localized Overview Work queue for pending requests, unconverted custom inquiries, and overdue invoices, and removed the now-duplicated standalone Pending Requests card. Average Turnaround is now full width instead of sitting in an empty two-column wrapper.

- Matched the Team section’s parent spacing to Packages so the tab header and 360px list begin at the same vertical position and remain stable when switching tabs.

- Set the Packages and Team list containers to the exact same fixed 360px height, so the bordered table area does not move or differ when switching tabs; additional rows scroll inside that shared viewport.

- Raised the list scroll threshold from 288px to 400px so the existing Packages and Team content keeps its current visual height; only future additions beyond that point will scroll, while the modal remains fixed.

- Made the Packages and Team member lists independent 288px scroll regions with matching behavior, while keeping the Settings modal fixed at 600px so future entries do not resize it.

- Matched Team rows to the Packages text hierarchy and spacing: 14px primary text, 13px secondary/metadata text, 4px secondary spacing, and 8px before the third line.

- Matched Team member typography to Packages: 14px names, 13px secondary text, and 12px metadata.

- Added a localized Joined date beneath each team member’s email in Team settings, using the staff account creation date.

- Matched the Team and Packages tab header alignment so descriptions and action buttons start at the same top edge.

- Rebalanced the Packages and Team tab descriptions to similarly concise action-oriented copy in English, German, and Albanian.

- Matched the Team tab’s top area to Packages: a muted description on the left and a small filled plus-button on the right, using a new localized Team description.

- Kept the Settings modal at one compact fixed 600px height across Packages and Team tabs, with the inner content scrolling when the invite form or longer lists need more room.

- Matched Team and Packages lists with the same overflow, border, separator, and 20px row padding treatment. Removed the fixed Settings modal height so it now fits its content and scrolls only when needed, eliminating the empty space below.

- Changed Team settings so the invite form is hidden by default and opens inside the modal from an Invite a teammate button, with Cancel to close it and automatic close after a successful invitation.

- Reduced the effective Settings modal width from 720px to 680px for the further narrowing requested.

- Reduced the effective Settings modal width from 760px to 720px for the tighter layout requested.

- Reduced the effective Settings modal width from 800px to 760px for the tighter layout requested.

- Reduced the effective Settings modal width from 840px to 800px for a more compact workspace.

- Tightened the effective Settings modal width from 880px to 840px after the wider version still felt a little broad.

- Set the now-working Settings modal width to 880px after the corrected 960px version felt too wide.

- Fixed the shared DialogContent `sm:max-w-sm` constraint overriding the Settings modal width; the 960px width now has an explicit responsive max-width override.

- Widened the Settings modal to 960px after 880px still felt constrained, while keeping it slightly more focused than the original 1000px width.

- Adjusted the Settings modal to 880px after 760px felt too narrow, keeping the more focused shape without returning to the original 1000px width.

- Narrowed the Settings modal from 1000px to 760px with a responsive viewport-safe max width so it feels more focused and less oversized.

- Removed the artificial two-line KPI hint reservation so the balanced descriptions no longer leave an awkward empty area at the bottom of the tiles.

- Rewrote KPI supporting copy into similarly sized three-word phrases across Overview and Analytics, with German and Albanian translations added as well.

- Standardized KPI hint descriptions with a two-line, 32px reserved area and consistent line height so tiles remain visually aligned despite different copy lengths.

- Replaced the Overview average-turnaround KPI with total projects so Average turnaround appears only in Analytics while the detailed Overview turnaround card remains available.

- Replaced Overview’s repeated revenue, outstanding, and overdue KPI tiles with operational metrics: Active projects, Pending requests, Average turnaround, and Unread notifications. Analytics keeps the financial KPI set.

- Removed the duplicated revenue charts from Overview so it functions as a quick operational snapshot; Analytics now owns the full revenue and performance reporting set.

- Matched Average Turnaround and Pending Requests to the same 56px row height, spacing, inset, truncation, and right-side alignment used by the paired activity cards.

- Matched the minimum row height and vertical gap in Recent Projects and Notifications so their entries line up across the side-by-side Overview cards.

- Opened up Recent Projects rows with more vertical spacing, a small inset, truncation for long names, and quieter right-aligned status text.

- Removed repeated row separators from the Overview Recent projects and Notifications cards, replacing them with consistent vertical spacing while keeping the card headers structured.

- Placed Overview Recent projects and Notifications cards in a responsive two-column grid on large screens, stacking them on smaller screens to reduce the long vertical gap.

- Undid the table-control relocation: search and filter rows are back above their tables for Projects, Requests, Custom inquiries, Clients, and Invoices.

- Moved search and filter controls into bordered table headers for Projects, Requests, Custom inquiries, Clients, and Invoices, so each table owns its controls instead of leaving them detached above it.

- Balanced the inline header separator at 12px with moderate muted contrast after the larger 14px bullet felt too prominent.

- Enlarged the inline header separator to a visible 14px bullet with a stronger muted color.

- Increased the inline CRM header descriptions again to 13px after they still read too small at 12px.

- Increased the inline CRM header descriptions to 12px and confirmed the main page descriptions are no longer duplicated in the page bodies.

- Vertically centered the middle-dot separator with the inline CRM title and description and tightened its line box.

- Added a muted middle dot between each CRM page title and its inline description in the sticky header.

- Aligned each CRM page description inline beside its header title on the same baseline instead of placing it underneath.

- Moved each main CRM page description beside its title in the sticky header and removed the duplicate body descriptions, so content begins immediately below the header.

- Removed the reserved page-intro height so CRM content and page actions pull up cleanly after the section title moved into the sticky header.

- Grouped the CRM header language, theme, notification, and account controls into one right-aligned cluster so adding the page title does not spread the buttons across the header.

- Preserved the original 48px page-intro height after moving section titles into the sticky header, so page actions and the first content section stay in their previous positions.

- Moved the translated CRM section title into the sticky header for Overview, Analytics, Projects, Clients, Invoices, and Notifications. Removed the duplicate large heading from each page while keeping the supporting intro copy; detail pages still keep their specific project/client/request names in the content.

- Softened bordered CRM cards, table containers, and panels to a consistent 16px radius so the dashboard no longer feels square.

- Made the Notifications dropdown’s View all link fully pill-shaped to match the CRM controls.

- Unified hover styling for CRM header Language, Theme, Notifications, and account controls with the same muted surface, foreground color, and 150ms transition.

- Moved the compact Theme and EN/SQ/DE Language controls from the account dropdown into the CRM header beside Notifications and the account avatar.

- Removed Theme and Language labels from the account dropdown and combined their icon/code controls into one compact row.

- Enlarged Settings and Log out icons to 20px and shifted their rows 4px right within the account dropdown.

- Reordered the account dropdown into Profile → Theme/Language preferences → divider → Settings/Log out, keeping related controls together.

- Added a tight separator between Settings and the Theme/Language preference rows, replacing the previous negative offset.

- Fine-tuned the Theme/Language preference group to sit 12px closer to Settings in the account dropdown.

- Set the account-menu language trigger to 48px and its open EN/SQ/DE panel to an explicit 7rem width to remove excess right-side space.

- Increased Settings and Log out labels to 13px medium weight with 16px icon spacing, and narrowed the account menu language selector to 80px.

- Removed the Settings Display tab and moved Theme and Language controls into compact rows in the CRM account dropdown; Settings now contains only Packages and Team tabs.

- Removed the redundant legend from Analytics Revenue by package so it matches the simplified Overview card.

- Excluded Analytics Invoices by status from the CRM table treatment so it stays a compact report table without zebra rows, grey headers, or fixed-height rows.

- Reduced the CRM account dropdown from 16rem to 14rem after it still felt too wide.

- Increased vertical padding on the CRM account menu’s Settings and Log out actions to 16px, giving each a 48px touch target.

- Widened the CRM account dropdown from 16rem to 18rem so Settings and Log out have more room.

- Changed sidebar navigation links from medium rounded corners to full pill shapes in expanded and collapsed states.

- Added 24px of top spacing between the sidebar logo/title header and the first navigation link.

- Increased sidebar navigation labels to 16px, icons to 18px, row padding to 14px, and item spacing to 20px for a fuller but natural rhythm without forced full-height distribution.

- Reverted the full-height distributed sidebar navigation after it created artificial gaps; the links remain top-aligned with 16px spacing.

- Increased left sidebar navigation spacing to 16px between links and 16px between icons and labels when expanded.

- Increased spacing between the CRM top-header notification bell and account avatar from 8px to 12px.

- Added a subtle neutral grey background to CRM table header cells in both themes, matching the table row treatment.

- Replaced the light-mode blue zebra tint with a neutral grey 5% stripe and 9% hover state.

- Added restrained zebra striping to CRM data tables with a stronger hover tint; empty-state rows remain untouched.

- Removed the redundant package legend below the Overview revenue-by-package chart; the chart and Analytics legend remain unchanged.

- Enlarged the CRM header notification button to 36px with a 20px bell and the closed account avatar to 32px.

- Applied the same separated header treatment to Average turnaround and Pending requests, including their subtitles, so all four lower Overview cards are consistent.

- Gave the Overview Recent projects and Notifications cards distinct header areas with a bottom separator and dedicated spacing before their lists.

- Included the CRM top-header controls in the pill treatment so the notification bell and account button match the rest of the dashboard.

- Extended the CRM pill shape to all buttons; equal-sized icon-only controls render as circles while marketing buttons remain unchanged.

- Scoped pill-shaped styling to CRM inputs, search fields, select triggers, and textareas; their borders, sizes, and focus states remain unchanged.

- Opening the notifications dropdown now dismisses only the local bell indicator for the notifications currently seen; server read status is unchanged, and newly arriving notifications show the dot again.

- Added a compact right-arrow icon to the notifications dropdown’s View all link.

- Tightened the notification list area from 28rem to 27rem so the sixth row is the final fully visible row and the seventh does not peek through.

- Increased the notification list area to 28rem so six 72px notification rows are fully visible when the dropdown opens.

- Increased notification rows to a 72px minimum height with 16px vertical padding so the larger dropdown feels proportionate.

- Enlarged the notification dropdown from 22rem to 24rem wide and increased its scrollable content height from 20rem to 24rem.

- Flattened notification dropdown rows so they have no inset/rounded shape or focus highlight; separators now provide the visual grouping.

- Standardized normal CRM table data rows to a fixed 64px height with vertically centered content; empty and no-results rows remain flexible.

- Made the analytics Pipeline by stage card fill its grid height and distribute stage rows through the available space instead of leaving a large bottom gap.

- Made the sidebar toggle a larger 36px control centered in the bottom utility area for a more intentional layout in both expanded and collapsed states.

- Aligned the expanded sidebar toggle to the bottom-left navigation column; it remains centered when the sidebar is collapsed.

- Moved the sidebar collapse/expand icon into a bottom utility area so it no longer competes with the logo.

- The CRM sidebar can collapse from 224px to 64px, showing icons only; the content offset transitions with it so the expanded sidebar pushes content instead of overlaying it.

- The CRM top navbar stays visible and minimizes from 64px to 48px after the content scrolls, expanding again at the top.

- Increased vertical padding on CRM table body rows to a consistent 16px; larger colspan empty states are unchanged.

- The CRM header account control is initials-only when closed; its open menu now shows the larger initials avatar, full staff name, and email.

- Scoped CRM dashboard controls so focused, Space/active, expanded, and selected button/select states keep the keyboard focus ring but do not show a border.

- Made the marketing navbar’s solid cyan background explicit in the header component so it does not fall back to the transparent background utility.

- Explicitly removed the accidental dark gradient strip from the light-mode request-modal title and modal surface. Light-mode modal fields now use a clearly visible light blue-gray fill with no outer border or focus shadow; required-field asterisks and inline empty-field labels use a deeper teal-blue with an alert icon in a fixed-height label row above the field, so validation does not move or misalign the textboxes. The custom app dialog and contact form use the same validation treatment, and all of their buttons show a hand cursor. Hero actions now share a fixed height and vertical alignment.
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
