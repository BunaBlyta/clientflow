### 2026-08-11 07:45 — Claude (Cowork) — mobile: fix the remaining infinite re-render loop (notifications screen)

Changed:
- The previous fix (07:30 log entry) closed four of these bugs but missed a fifth.
  The app was still throwing "Maximum update depth exceeded," and the error
  pointed at `app/(app)/_layout.tsx` line 11, the `<Tabs>` navigator. That was a
  red herring — React blames the nearest navigator when this kind of loop
  happens, not the actual source.
- The real cause was in `mobile/app/(app)/notifications.tsx`. The notifications
  screen read its list from the shared data store with a selector that copied the
  array and sorted it (`[...s.notifications].sort(...)`) on every single read.
  Just like the four cases already fixed, that builds a brand-new array each
  time even when nothing changed, and the state library (Zustand) treats "new
  array" as "the data changed" — so it kept telling the screen to redraw, which
  asked for the list again, which built another new array, forever.
- Fixed the same way as before: wrapped that selector in Zustand's `useShallow`
  helper, so it now compares the list's contents instead of comparing "is this
  the exact same array in memory." The screen only redraws when the actual data
  changes.
- Left alone, on purpose: the unread-count selector (`unreadNotificationCount()`)
  in both `notifications.tsx` and `_layout.tsx` — that one returns a plain
  number, which is already stable and was never the problem. Also left alone the
  "mark as read" / "mark all as read" selectors, since those return stable
  function references, not new objects.
- Re-checked the whole mobile app by hand for every shape of this bug (array
  copies, `.sort()`, `.filter()`, `.map()`, `.slice()`, object literals) built
  directly inside a store selector without `useShallow`. Found nothing else —
  this was the last one.
- Verified with a full TypeScript check (`npx tsc --noEmit`) across the whole
  mobile app — zero errors.

Tried and abandoned (what didn't work, and why):
- Nothing abandoned this pass — the fix was small, matched the pattern already
  established for the other four screens, and worked on the first try.

Left for next session:
- Still need an actual click-through of the app (browser and/or simulator) end
  to end now that both rounds of this bug are fixed, to confirm nothing else is
  hiding — that manual walkthrough still hasn't happened.
- Still not wired to a real backend — everything runs against the local mock
  data store. Real Stripe, real push notifications, and real verification emails
  are all still mocked, as before.

Assumptions made (flag if wrong):
- None new this pass — no behavior or data changed, only how one screen reads
  already-existing data from the store.

Blockers:
- None.
