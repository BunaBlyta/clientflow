# CURRENT — mobile lane (Agent C)

Last updated: 2026-08-17 00:44 by Codex — home spacing and tracker readability

## Current state

- The Expo client keeps the existing live login, verification-code onboarding,
  projects, project status tracking, shared notes, invoices, Stripe checkout,
  and in-app notifications behavior.
- The mobile presentation now follows the Clientflow landing language more
  closely: warm-white light surfaces, near-black dark surfaces, restrained
  #CAF4FF / #A0DEFF cyan atmosphere, Inter hierarchy, hairline separators,
  and tactile pressed states.
- The app tab bar now presents Home, Projects, Invoices, Notifications, and
  Account. Home and the global Invoices view reuse existing store data and
  existing navigation/actions; no API or data-fetching behavior changed.
- Home has a friendly greeting, a current-project status tracker, and a next
  action row for the first payable invoice or the project notes.
- Projects use calm editorial rows with numbered cyan identity marks, status
  dots, and understated chevrons. Project detail keeps the existing paid /
  outstanding totals, package overview, notes preview, invoice preview, and
  the horizontal stage tracker.
- Stage tracker circles now use stage icons for the current stage, a cyan
  pulse, a connected progress line, and muted completed/future states.
- Notes are now a thin-line activity feed with small author metadata and a
  subtle cyan wash for client-authored entries; the composer remains wired to
  the existing post-note action.
- Notifications are now a simple activity list with understated icons and a
  small cyan unread dot; existing mark-read and mark-all behavior is intact.
- Shared buttons now have a restrained cyan gradient and pressed treatment.
  Text fields use lightly inset muted surfaces, minimal borders, and softer
  focus states. Auth screens inherit these shared improvements and retain the
  existing cyan backdrop.
- Account uses flatter information/preferences sections while retaining theme,
  language, logout, and confirmation behavior.
- Follow-up refinement removed the active tab background; the active icon is
  now brighter with a stronger stroke. Theme and language choices are now
  quiet text rows with only a checkmark for the selected option.
- Home’s invoice summary now shows the count once, and the tracker’s “currently
  in progress” text is laid out below the active phase label instead of using
  an overlapping absolute position. Home’s next-action heading is also now
  translated instead of reusing “View all”.
- Account information now keeps only Email and Company, with plain text rows
  and no decorative icon tiles. The existing Contact row was removed from the
  presentation.
- Home now uses the same shared top spacing as the other tab screens. The
  tracker’s “currently in progress” message is a larger, centered line below
  the timeline instead of a tiny label inside the active stage column.
- Native Stripe checkout now polls the invoice for about 12 seconds after the
  user returns from the browser. This gives the webhook time to mark the
  invoice paid instead of incorrectly showing that no payment was confirmed.

## Verification

- `cd mobile && npx tsc --noEmit`: passed.
- `cd mobile && npx expo export --platform web --output-dir /private/tmp/clientflow-mobile-preview`: passed.
- `git diff --check -- mobile`: passed.
- No connected simulator, device, or in-app browser was available for a visual
  screenshot pass.

## Latest verification

- `cd mobile && npx tsc --noEmit`: passed.
- `cd mobile && npx expo export --platform web --output-dir /private/tmp/clientflow-mobile-check`: passed.
- The native payment flow still needs a fresh simulator click-through after
  restarting Expo with the updated bundle.

## Known limits

- Push notifications remain intentionally deferred; in-app notifications are
  unchanged.
- The request-status screen remains fixture-backed because its API contract
  has no public prospect request-status endpoint.
- The payment confirmation polling change is ready to commit and push.
