# 2026-08-27 17:30 — Claude Code — swipe-back should match the back button

Buna: swiping off a page sends you somewhere random; it should do what the
back button does.

## Cause

`useOriginBack(source)` (behind `AppBackButton`) already handles this for the
button: when a screen carries a `source` param naming the tab it was opened
from, the button calls `tabs.navigate(source)` to return to that tab.

The swipe-back gesture / Android hardware back had no such handling — they
did a plain stack pop. The only place this diverges is Home: `home.tsx` uses
`useProjectTabNavigation`, which does `navigation.navigate('projects', {
screen: '[id]/index', params: { source: 'home' } })` — i.e. it pushes the
project screen onto the *projects* stack, on top of a projects-list screen
the user never saw. Button → Home tab (right). Swipe → pop to the projects
list (wrong / "random"). (Notifications and Invoices don't hit this — they
navigate within their own stack via mirror routes and pass `tab`, not
`source`, so a pop is already correct there.)

## Fix

`mobile/components/OriginBackButton.tsx` — `useOriginBack` now also registers
a `navigation.addListener('beforeRemove')`. When `source` is a tab and the
removal is a `GO_BACK` action (swipe, hardware back, native header back), it
`preventDefault()`s the pop and calls the same `goBack()` the button uses.
Only one `AppBackButton` is mounted per screen at a time (verified across all
render branches of the 3 project screens), so the listener is never doubled.
Screens with no `source` are untouched — a plain pop is already right for
them.

## Verify

- `npx tsc --noEmit` from `mobile/` — clean.
- NOT tested on device. Needs a check that native-stack (`react-native-screens`
  4.26 / `@react-navigation/native-stack` v7) fires `beforeRemove` for the
  swipe gesture and that `preventDefault()` cancels it cleanly (it should in
  these versions; older combos needed `gestureEnabled: false`). Test: open a
  project or the "Next up" invoice from Home, swipe back → should land on
  Home, not the Projects/Invoices list.
- If the gesture is swallowed before `beforeRemove` on this stack type, the
  fallback is to give Home its own nested stack with mirror routes (same
  pattern as `notifications/`), which makes a plain pop correct and needs no
  gesture interception.
