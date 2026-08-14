# CURRENT — mobile lane (Agent C)

Last updated: 2026-08-14 16:47 by Codex — polish mobile visual system

## Current state

- The Expo client has live login, verification-code onboarding, projects,
  project status tracking, shared notes, invoices, Stripe Checkout, and
  in-app notifications. Push notifications remain deliberately cut from v1.
- The mobile visual system mirrors the public landing page selectively: white
  surfaces, restrained #CAF4FF cyan washes, and #A0DEFF highlights around the
  existing blue artwork.
- The SVG cyan gradient is intentionally limited to the auth flow and the
  projects overview. Detail, notes, invoice, account, and notification pages
  use the clean app canvas instead of repeating the same backdrop.
- Brand accents use the exact landing cyan `#CAF4FF`, while muted content
  surfaces stay neutral so Notes and Invoices do not read like colored panels.
- Shared scrollable screens use a tighter top and bottom canvas inset, so the
  content does not feel stretched while section-level spacing remains intact.
- The login screen uses the existing blue app artwork as its brand mark instead
  of a generic grid icon. No artwork files or web files were changed.
- Auth uses Expo Router's native Stack header for verification, password,
  forgot-password, and request-status screens. Login remains headerless, with
  its own safe-area padding.
- Scrollable Screen content adds the device bottom inset to its existing 32px
  bottom padding. The request-status screen remains fixture-backed because the
  API contract has no public prospect request-status endpoint.

## Latest change

- Added mobile/components/ui/CyanBackdrop.tsx, using the existing
  react-native-svg dependency for landing-style cyan gradients and subtle
  radial glows without installing a package.
- Integrated the backdrop into shared app screens, auth screens, and the
  notes composer screen.
- Replaced the login LayoutGrid mark with the existing mobile/assets/icon.png
  artwork, preserving the blue visual language.
- Changed light and dark primary action tokens to the exact landing cyan
  values: #CAF4FF and #A0DEFF. The artwork stays blue, but buttons, links,
  active states, and gradient glows now use the same cyan system.
- Removed the Projects label from the bottom tab and removed the blank Projects
  navigation header while keeping headers on project detail screens.
- Added the iPhone top safe-area inset to the headerless Projects list so the
  greeting and first project no longer sit underneath the status-bar clock.
- Flattened the generic project, tracker, account-info, checkout-summary, and
  request-result cards into editorial sections and hairline-separated rows.
  Conversation bubbles, status banners, buttons, and preference controls remain
  distinct because they communicate interaction or state.
- Removed the visible Projects stack headers while keeping the project, Notes,
  Invoices, invoice, and Checkout titles in the screen content. Shared Screen
  now supplies the top safe-area inset for headerless screens; auth headers
  remain native for iOS back navigation.
- Restored the prior dark theme after the cyan/black inversion was rejected:
  near-black canvas with cyan accents and light status-bar icons.
- Softened the backdrop after the first direct-cyan pass felt too harsh. The
  source color remains the web landing value, while the gradient opacity is
  now closer to the web artwork's subtle wash.
- Reduced the shared Screen's extra top and bottom breathing room to make the
  overall layout denser without removing the device safe-area padding.
- Replaced the dark theme's remaining `#18364D` brand-blue soft accent with
  the web landing cyan. Semantic status colors and the existing blue artwork
  were intentionally left alone.
- Restored native iOS-style minimal chevrons on auth and project-detail
  navigation headers while keeping the visible page titles in the content.
- Added an explicit Screen backdrop opt-in and removed the notes-page backdrop
  so every page no longer shares the same cyan treatment.
- Neutralized the client note bubble and Notes composer strip so Notes reads as
  a clean conversation surface. Invoice status colors remain semantic and
  scannable rather than being treated as brand decoration.
- Removed the muted cyan fill from the checkout form field; invoice surfaces
  now stay neutral except for primary actions and semantic status banners.
- Removed the pale cyan cast from muted light surfaces and note bubbles. Cyan
  remains reserved for actions, icon wraps, and deliberate brand moments.
- Removed the tinted fill from the Project detail's Notes and Invoices section
  header strips. They now use the project canvas with only hairline separators.
- Refined the Projects overview into a tighter native list: removed its cyan
  backdrop, reduced row whitespace, and added small semantic status dots beside
  the existing status text.
- Kept the Project detail Notes and Invoices content on the plain canvas while
  giving only their section header strips a restrained translucent `#CAF4FF`
  tint.
- Centered the project stage tracker block so its progress line no longer
  stretches across the full content width.
- Changed the Notes and Invoices section strips to restrained `#A0DEFF` pills.
- Rebuilt the project stage tracker as a horizontal timeline with alternating
  labels above and below the centered progress line.
- Restored the cyan fill on client-authored note bubbles while keeping studio
  and system messages neutral for clear conversation contrast.
- Set client bubble body and timestamp text to the near-black accent text token,
  and removed white text from light-theme cyan actions for better contrast.
- Kept the client message bubble at the exact `#CAF4FF` cyan with black text.
- Changed the other/studio message bubble to darker grey `#CBD5DC`, also with
  black body and timestamp text.
- Darkened only the date stamps on system status-change rows to `#64747D`.
- Lightened the borders on received note bubbles and the Write a note field so
  those controls feel quieter and less card-like.
- Increased the Write a note field border visibility to a soft `#D5E2E8` so it
  remains light without disappearing against the background.
- Added extra separation between message blocks in the Project detail Notes
  preview only; the full Notes conversation keeps its existing density.
- Increased vertical rhythm around Project stats and the status tracker so the
  Notes preview starts below the initial project view and appears on scroll.
- Increased the gap after the status tracker and before Notes again so the
  project overview has a taller, calmer opening view.
- Extended that opening gap once more so Notes is decisively below the fold on
  the initial Project view.
- Replaced the empty space before Notes with a Project overview block using
  the package description and target launch date when available. Notes remain
  further down the scroll.
- Extended the Invoices section spacing to match the calmer Notes and overview
  rhythm, including more room after the preview rows.
- Project Notes preview now shows only one real client/studio note; system
  status-change entries stay out of the preview.
- Increased spacing between the two invoice preview rows themselves, while
  reducing empty section-only spacing around Notes and Invoices.
- Kept that invoice separation outside the row dimensions: preview rows are
  compact again and use a small inter-row gap instead of oversized padding.
- Inset Project invoice preview rows and their separators horizontally so they
  stay within the Notes/Invoices pill width. The full invoice list is unchanged.
- Tightened the Project Notes preview by reducing the gap before it and the
  trailing space after its single note; the full Notes screen is unchanged.
- Reduced the specific transition gap after the Notes preview before the
  Invoices pill, without changing spacing inside either section.
- Compacted Projects list rows to show only project name and package, removing
  the arrow, target date, and stage/status metadata. Detail screens retain all
  project tracking information.
- Added a slim cyan edge marker and two-digit row index to the compact list so
  it has visual hierarchy without returning to heavy card styling.
- Removed the edge marker after review; compact rows retain only the two-digit
  index and project/package hierarchy.
- Added one subtle rounded list group around the Projects rows to give the
  overview depth without returning to separate card treatments.
- Added a very subtle muted background to each compact row so the list has
  clearer visual separation inside the group.
- Extended each row background across the full grouped list width and moved
  horizontal padding into the row content so the fill is not clipped.
- Added a subtle hairline separator between the Project title/package and the
  paid/outstanding price stats on the Project detail screen.
- Increased that separator to the stronger theme border token so it remains
  clearly visible while staying a one-pixel hairline.
- Added small numbered cyan identity tiles to the Projects rows, giving the
  list a more considered visual anchor without adding arrows, statuses, dates,
  or heavy card decoration.
- Extended the grouped iOS-style surface treatment to Account information,
  Notifications, and the full Invoices list. Auth remains the expressive cyan
  entry flow, and Notes keeps its conversation-specific bubbles.
- Stabilized the horizontal tracker labels so “Currently in progress” stays in
  its own fixed position and cannot shift the active stage name.
- The Projects list now uses a grouped surface with full-width muted rows and
  small numbered cyan identity tiles; rows no longer show arrows, dates, or
  stage metadata.
- Project detail now has a package overview, horizontal stage tracker with
  fixed alternating labels, one real note in the Notes preview, compact inset
  invoice previews, and a clear title-to-stats separator.
- Account information, Notifications, and full Invoices now share the same
  restrained grouped-list treatment. Notes keep their message-specific
  bubbles, with status dates formatted inline as `status · date`.
- Simplified system status entries by removing the leading dot and joining the
  status change and date with an inline ` · ` separator.
- Kept the current mobile information architecture and rounded surfaces; the
  landing reference also uses a restrained rounded app preview, so cards were
  not removed without a concrete usability benefit.

## Verification

- cd mobile && npx tsc --noEmit under Node 22.23.2: passed.
- cd mobile && npx expo start --web under Node 22.23.2: launched in offline
  mode; the sandbox does not provide a reliable local HTTP smoke check.
- Root npm run test: passed — 34 test files, 145 tests.
- Root npm run typecheck: passed.
- Root npm run lint: passed.
- git diff --check: passed.

## Next work / known limits

- Push notifications are intentionally deferred; in-app notifications remain
  live.
- No physical iPhone, simulator, or in-app browser screenshot was available,
  so the new gradient treatment still needs a visual device check.
- Commit and push remain intentionally deferred until Buna explicitly
  authorizes them.
