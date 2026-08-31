### 2026-08-11 07:30 — Claude (Cowork) — mobile: fix infinite re-render loop, run app in a browser

Changed:
- Fixed a bug where the app would get stuck in an endless refresh loop and throw
  the error "The result of getSnapshot should be cached to avoid an infinite
  loop." The cause: three places in the shared data store — the list of a
  client's projects, the list of a project's invoices, and the list of a
  project's notes — were built by filtering a bigger array every time a screen
  asked for them. Each filter run produced a brand-new list in memory, even when
  nothing had actually changed. The app's state library (Zustand) treats "a new
  list" as "the data changed," so it kept telling the screen to redraw itself,
  which asked for the list again, which produced another new list, forever.
- Fixed it by having those screens compare the *contents* of the list instead of
  whether it's the exact same list in memory, using a helper Zustand provides for
  this (`useShallow`). Now the screen only redraws when something in the list
  actually changed.
- Touched four screen files only, no changes to the store itself: the projects
  list screen, the project detail screen, the project's invoices list screen, and
  the project's notes screen (all under `mobile/app/(app)/projects/`).
- Left the two selectors that look up a single project or a single invoice by ID
  alone — those already return the same object each time (nothing to fix there),
  wrapping them would have been unnecessary.
- The app was also run in a browser for the first time (previously it had only
  been checked with a type-check and an offline export, never actually opened).
  That run surfaced this bug directly — it's the kind of problem that shows up
  under a browser's stricter checks but stays invisible in a normal phone
  simulator. It also surfaced a second, smaller bug: there was no screen
  registered for the app's very first address ("/"), so opening the app fresh in
  a browser landed on an "Unmatched Route" error instead of the login or projects
  screen. Fixed by adding `mobile/app/index.tsx`, which sends the visitor to the
  projects list if they're logged in, or the login screen if not. Also added the
  two packages (`react-dom`, `react-native-web`) needed for the app to run in a
  browser at all.
- Verified with a full TypeScript check (`npx tsc --noEmit`) across the whole
  mobile app — zero errors.

Tried and abandoned (what didn't work, and why):
- Nothing abandoned this pass — the fix was small and worked as expected on the
  first pass.

Left for next session:
- Click through the app in the browser end to end (and ideally a real
  simulator/device too) to make sure nothing else is hiding behind these two
  bugs — this pass fixed what was found, but wasn't a full manual walkthrough of
  every screen.
- Still not wired to a real backend — everything runs against the local mock
  data store. Real Stripe, real push notifications, and real verification emails
  are all still mocked, as before.

Assumptions made (flag if wrong):
- None new this pass — no behavior or data changed, only how four screens read
  already-existing data from the store.

Blockers:
- None.
