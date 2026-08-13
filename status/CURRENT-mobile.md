# CURRENT — mobile lane (Agent C)

Last updated: 2026-08-13 16:50 by Codex — nested project UI cleanup

## Completed

- Polished the themed mobile UI after review feedback: the bottom tab footer now
  uses a deliberately darker theme surface with a clean edge and restrained
  shadow, making its labels easier to read without changing tab sizing or
  positioning.
- Replaced pill-shaped status badges with compact rounded-rectangle labels and
  softened secondary, cancel, logout, and language controls by removing hard
  borders and using subtle surface contrast/shadows. Primary buttons retain a
  restrained accent glow.
- Removed all in-content project back controls so nested project screens use
  the existing top navigation bar consistently.
- Removed status/unread badges from the mobile UI. Project and invoice status
  now appears as plain semantic text, while notification read state and
  mark-read behavior remain functional.
- Reworked note rows into clean authored sections with intentional separators
  and spacing. Invoice rows retain clear dividers and now use a quieter text
  hierarchy for amount, metadata, and status.

- Added a persisted mobile appearance preference with System, Light, and Dark
  choices. The initial appearance follows the device/browser system theme; an
  explicit choice is stored locally with SecureStore on native and localStorage
  on Expo web.
- Applied centralized light/dark theme tokens to authentication, projects,
  project details, notes, invoices, checkout, notifications, account, shared
  controls, empty states, loading states, errors, tab navigation, and headers.
- Added an account language selector for English, Albanian, and German. Static
  mobile UI/status/error copy uses the selected language with English fallback;
  user-generated project/note/invoice content and API notification messages stay
  unchanged.
- Preserved all existing navigation, deep-link routes, Stripe browser opening,
  AppState refresh, API invoice refresh, and webhook-confirmed PAID success gate.

- Mobile note reads and posting are live through the notes API.
- Mobile notification reads, single mark-read, and mark-all read are live
  through the notification API.
- The account screen uses an inline logout confirmation instead of a native
  alert.
- The Stripe checkout request now sends `{ invoiceId, returnTo: "mobile" }`.
  This lets the API/payment page return the client to the mobile deep link.
- The existing checkout flow is unchanged: it opens Stripe's `checkoutUrl`,
  refreshes the invoice when the app returns through `AppState`, and only shows
  success after the API returns webhook-confirmed `PAID` status.
- Verified the intended destination remains
  `clientflow://projects/<projectId>/invoices/<invoiceId>/checkout`: the app
  still declares the `clientflow` scheme and the Expo Router route remains the
  existing checkout screen.
- Verified the web fallback route directly at
  `http://localhost:8081/projects/<projectId>/invoices/<invoiceId>/checkout`.
  Expo returned the web app shell, and the generated Metro bundle included the
  exact checkout route module.
- No mobile routing or configuration change was required; the current Expo
  Router file structure already resolves this path in web mode.
- The project homepage now refreshes live notes and invoices when it opens,
  shows the two newest note previews, and shows up to two visible invoice rows.
  DRAFT invoices remain hidden, while totals and “View all” links are
  unchanged.
- The homepage and all nested project screens use the existing top navigation
  bar for back navigation; nested route destinations and links remain intact.
- Checkout's success and declined-payment return actions use the same absolute
  invoice route. Stripe opening, AppState refresh, invoice refresh, and the
  webhook-confirmed `PAID` success gate were not changed.
- The note preview bug was caused by taking the last two items from a
  newest-first selector; it now takes the first two live/saved notes.
- The app tab footer now has explicit height, safe-area padding, and label line
  height so Projects, Notifications, and Account remain fully visible on small
  screens.
- The logout confirmation now gives Cancel and Log out equal-width halves of
  the action row, while retaining the destructive action's existing styling.
- The standalone Log out action no longer inherits confirmation-row flex sizing
  and is full width again. The Account screen also reserves the full tab-footer
  height plus a buffer below its version label so the white tab footer cannot
  cover the bottom of the text.
- The tab layout no longer overrides Expo Router's calculated tab-bar height or
  vertical padding; this removes the white clipping strip that was covering tab
  labels. The logout confirmation message now appears below the equal-width
  Cancel and Log out buttons.
- Removed the remaining custom tab-label font override so Expo Router's native
  label sizing is used without clipping. Added a small lower offset to both the
  confirmation message and the `Clientflow · v1.0.0` footer.
- The bottom tab footer now has a 64px content height plus the device safe-area
  inset, making the footer visibly taller toward the top without changing the
  working native label sizing.
- Tab items now use symmetric vertical padding inside the taller footer so each
  icon and label group remains vertically centered.
- Mobile notifications now consume optional `projectId`, `invoiceId`, and
  `requestId` target fields. Invoice-plus-project notifications open invoice
  detail; project notifications open project detail; notifications without a
  usable mobile target only mark themselves read and stay on Notifications.
- Notification refresh and mark-read responses are stored without reshaping,
  so the target IDs supplied by the API remain available after refreshes.

## Verification

- `npx tsc --noEmit` from `mobile/`: passed.
- Root `npm run test`: passed — 32 test files, 132 tests.
- Root `npm run typecheck`: passed.
- Root `npm run lint`: passed.
- `npx next build --webpack`: passed.
- `npm run verify`: typecheck, lint, and tests passed; the Turbopack build
  could not fetch Inter from Google Fonts in the sandbox.
- `npx next build --webpack`: passed.
- `git diff --check`: passed.
- Account footer and logout confirmation changes: mobile TypeScript, root
  tests, root typecheck, and root lint all passed.
- Tab footer and equal-width logout actions: mobile TypeScript, root tests,
  root typecheck, root lint, and `git diff --check` passed.
- Account footer clearance and standalone Log out sizing: mobile TypeScript,
  root tests, root typecheck, root lint, and `git diff --check` passed.
- Tab label clipping and confirmation order: mobile TypeScript, root tests,
  root typecheck, root lint, and `git diff --check` passed.
- Final tab label and Account spacing polish: mobile TypeScript, root tests,
  root typecheck, root lint, and `git diff --check` passed.
- Taller bottom tab footer: mobile TypeScript, root tests, root typecheck, root
  lint, and `git diff --check` passed.
- Centered bottom tab items: mobile TypeScript, root tests, root typecheck, root
  lint, and `git diff --check` passed.
- Clickable notification targets: mobile TypeScript, root tests, root typecheck,
  root lint, and `git diff --check` passed.
- Mobile theme and English/Albanian/German localization: mobile TypeScript,
  Expo web export, and `git diff --check` passed. Root tests and lint passed;
  the root typecheck was blocked during the initial implementation by web
  changes, then passed in the final polish verification.
- Mobile visual polish: mobile TypeScript, Expo web export, root tests,
  typecheck, lint, and `git diff --check` passed.
- Nested project UI cleanup: mobile TypeScript, Expo web export, root tests,
  typecheck, lint, and `git diff --check` passed.
- No device or simulator testing was performed.
- Expo web smoke check was not completed: no Expo server was listening on
  `http://localhost:8081`, and the temporary `npx expo start --web` process did
  not bind a port in the sandbox. No browser, device, simulator, or native
  deep-link testing was performed.

## Notes for the next session

- The mobile app still uses `http://localhost:3000` unless
  `EXPO_PUBLIC_API_URL` is set to a reachable web/API origin.
