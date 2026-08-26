# CURRENT — mobile lane (Agent C)

Last updated: 2026-08-26 13:35 by Claude Code — more visible notes header separator

## What changed

- The Notes screen's sticky header (title + project name, pinned above the scrolling chat timeline) had only a hairline border in the app's lightest border color separating it from the scrolling content — too faint to read as a real boundary. Bumped it to a full 1px line in the stronger border token.

- Sent (client) note bubbles have a solid accent-colored background; the message text correctly turns white for contrast, but the timestamp underneath was still using the muted gray meant for light surfaces, making it nearly invisible. Switched it to white at reduced opacity, so it's readable while still reading as secondary to the message text.

- Audited every page for border-radius mismatches (user asked that elements on the same page match). Found the app already follows a consistent two-tier system app-wide — a larger radius for primary cards, a smaller one for nested rows/fields/buttons — with circles, pills, and the chat bubble's deliberate asymmetric "tail" corner correctly exempt from that. One real mismatch: the notes/chat composer's send button used a larger radius than the text input directly beside it (both 46px tall, same row) — fixed to match. Also swapped a literal `999` for the `radius.pill` token on the project detail status pill (same visual value, just consistent with how every other pill in the app is written).

- Put the Help & Support title next to its icon instead of stacked below it, and switched its back button to the shared `AppBackButton` component instead of a one-off Pressable with a different icon size and margins — that also removed a magic `marginTop: 30` that existed only to compensate for the mismatch.
- Fixed a spacing bug on Home: the "Recent activity" list was adding its own gap on top of `NotificationRow`'s built-in bottom margin, so the same row component rendered with more space between items on Home than on the Notifications tab. Removed the double-applied gap so both tabs match.
- Rounded one off-grid value (Home's phase-chip row gap, `5` → the 4px-grid `spacing.xs`).
- Audited the rest of the app's screens and shared components for similar spacing inconsistencies (magic numbers off the 4px grid, components rendering with different effective spacing in different places). Nothing else rose to the level of a real bug — the remaining differences (project cards vs. invoice rows vs. notification rows using different gaps, Account's own bottom padding) are deliberate/previously-fixed, not accidents, so left alone.
- `home.tsx` also carries this session's pending translation-string work (already uncommitted in that file before this pass); it rode along in the same commit since it's the same file.

- Moved the Notes label and project name into a fixed header row beside the back button. The header stays visible while the note timeline scrolls, including when Notes is opened from Notifications.

- Completed Albanian and German locale coverage across all 246 mobile translation keys. The audit now reports zero missing, extra, or duplicate keys in either locale, and every translation call in the mobile source resolves.

- Made the remaining mobile UI respond to the selected language: dates, times, currency, relative timestamps, generated notification titles/bodies, home notification summaries, auth placeholders, and API error fallbacks now use the active locale. User-written note content remains unchanged.

- Replaced the unavailable React Native `Intl.RelativeTimeFormat` constructor with a runtime-safe translated formatter, fixing the notifications render crash while preserving English, Albanian, and German relative timestamps.

- Added translations for remaining notification descriptions, including live project-request details and project stage transitions; user-authored note descriptions still remain original.

- Covered the backend’s exact system descriptions for confirmed/failed invoice payments, ready projects, approved/rejected requests, and sent invoices. Notification content written by a person is still preserved.

- Note notification taps now use the Notifications stack's nested chat route, keeping the Notifications bottom tab active like invoice notification taps do.

- Note notifications opened from the in-app Notifications list now go directly to the project chat instead of the project overview. Push notifications already used the chat target.

- Registered reset requests now continue to the code-entry screen even when Resend reports an uncertain delivery; unregistered emails still stop with the localized warning.

- Forgot-password now keeps unregistered emails on the email screen with a localized “not registered” warning. Registered emails continue to the six-digit code screen after the code is issued.

- Fixed the forgot-password send step so a successful verification email moves to the six-digit code screen. The previous implementation grouped navigation inside the email request error handler, which could show an email failure even after delivery; navigation now uses Expo Router's explicit pathname-and-params form.

- Matched the mobile client portal’s shared visual system to `mobile/assets/meridian-design-handoff`: warm off-white canvas, white cards, sage activity rows, exact Meridian teal accents, tighter 390px-style spacing, and restrained 12–24px typography.
- Added a system-safe serif accent for page titles, project names, invoice amounts, and section headings to mirror the handoff’s Lora treatment without installing another package.
- Updated Home to use the five phase-chip summary, compact payment/message stats, and handoff-style activity rows.
- Updated Projects, Invoices, Notifications, Account, and Project Detail headers and layouts; added client avatars to the tab screens.
- Replaced the project detail progress timeline with five phase icon states and resized the segmented ring to the handoff’s 136px treatment.
- Updated invoice and notification rows to use the handoff’s sage capsules with left accent rails.
- Changed default notification icons and rails to quiet grey, reserving soft red/green backgrounds and matching icon colours for danger/success states.
- Centered and slightly reduced the project detail ring, shortened invoice KPI cards, moved invoice/notification rails closer to the card edge, enlarged invoice amounts, and removed the white fill from View actions.
- Reshaped note bubbles so received messages use sage with a soft lower-left corner and sent messages use teal with a soft lower-right corner; sent messages now align to the right without a duplicate avatar.
- Added an Account Settings section for Language, Light/Dark theme, and Help & Support, plus a simple Help & Support screen. Theme selection changes the app palette in place.
- Dropped the project phase row slightly lower beneath the ring and explicitly hid Help & Support from the bottom tab bar; it remains reachable only from Account.
- Restored the five-tab layout spacing by moving Help & Support under a hidden Settings route, removed avatars from Home/Projects/Invoices/Notifications, and increased the visible page titles slightly.
- Gave Help & Support a horizontal icon/title header and separate description spacing.
- Matched Account’s title size to the other tab titles and added explicit 1px visible separators between the Home/Projects progress treatment and their date rows.
- Constrained the Projects list’s Started and Est. launch metadata to one line, with slight font shrinking and right alignment for the launch date.
- Removed the Home card’s client/company line, aligned its status pill to the project name, and changed completed project dates to “Launched”.
- Put the Help & Support icon first with its title directly below it.
- Right-aligned the Home launch-date metadata, inset chat author names slightly, and removed the top informational warning strip from Notes.
- Right-aligned the Home launch-date metadata and removed the “You” label from sent chat messages while keeping names aligned to their bubbles.
- Made chat bubbles size to their message content with a readable maximum width, and show a sender name only at the start of a consecutive run of messages from that sender.
- Styled project status-change entries in the chat with a lighter, pastel success green text colour.
- Removed the relative date from status-change entries so the label stays focused on the project transition.
- Removed the decorative Notes icon from inside the chat screen header.
- Replaced invoice status pills with plain semantic status text, preserving the matching status colours.
- Removed the extra icon from the Home status badge and changed Home’s View details action to a Lucide chevron-right.
- Simplified the bottom navigation by removing the rounded icon containers; active state now comes from the icon and label colour alone.
- Restored a restrained background behind only the active navbar icon and moved tab labels slightly lower for clearer separation.
- Enlarged the active navbar background cushion and reduced label size slightly so Notifications remains fully visible.
- Added a small gap between the Account Settings heading and its preference rows.
- Changed the primary Logout action to a filled semantic-red button with a light icon and label.
- Softened the Logout fill to the theme’s pastel danger background while retaining red text and icon.
- Anchored the Account version footer to the bottom of the available screen space.
- Added an explicit flexible spacer so the version line remains pinned just above the bottom navigation on short Account pages.
- Filled the confirmation-state Logout action with the same pastel danger background as the primary action.
- Replaced the login brand image with a Lucide Layers3 icon inside the existing brand mark.
- Centered the Lucide brand icon within its background mark.
- Removed the secondary Check a project request action from the login screen.
- Changed shared textboxes to use the app’s light sage-green surface.
- Fixed the theme transition animation so every theme animation stays JavaScript-driven, preventing React Native’s native/JS animated-node crash.
- Replaced the overlay-flash approach to the theme toggle (fading in a fixed target-color layer to hide an instant swap, then fading it out) with a genuine crossfade: the app background and the account screen's header, profile card, preference card, and settings rows now interpolate their real colors smoothly between light and dark instead of hiding a snap behind a masking layer. The overlay technique kept reading as a visible pulse/flash no matter how it was tuned (transparent enough to mask the swap looked like a snap; opaque enough to hide it looked like a solid black/white flash), so it was dropped rather than tuned further. Other theme-driven surfaces across the app (other tabs, buttons, hairline borders) still snap instantly — only the account screen and the shared background were converted, since that was the reported scope.

## Verification

- `npx tsc --noEmit`: passed.
- `npx expo export --platform web --output-dir /private/tmp/clientflow-mobile-meridian-check-v7`: passed before the final chat-only refinements.
- `git diff --check`: passed.
- `npx tsc --noEmit`: passed after the final chat bubble refinement.
- `npx tsc --noEmit`: passed after the theme animation fix.
- `npx expo export --platform ios`: passed after the theme animation fix.
- `npx eslint .`: mobile has no applicable ESLint configuration; ESLint reports that all files are ignored.
- `npx tsc --noEmit`: passed after the theme crossfade rework.
- `npx tsc --noEmit`: passed after the spacing consistency pass.
- `npx tsc --noEmit`: passed after the border radius consistency pass.
- `npx tsc --noEmit`: passed after the sent-bubble timestamp fix.
- `npx tsc --noEmit`: passed after the notes header separator fix.
- Browser preview inspection was unavailable because no browser connection was available in this session. The crossfade rework was reviewed by reading the code, not by running the app on a device/simulator.

## Scope and handoff

- No API contracts, stores, navigation behavior, payment behavior, or authentication behavior were changed.
- Existing unrelated auth/navigation work in the checkout was preserved and is not included in the design commit.
- The untracked handoff reference files were used as source material and left untouched.
