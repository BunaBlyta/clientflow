# 2026-08-27 17:45 — Claude Code — Account sub-pages open in their own stack

Buna: opening anything from the Account tab "behaves weird" — it should open
and close right there, not pull in another page or tab.

## Cause

`account.tsx` was a leaf tab screen with no stack of its own. Edit profile /
Change password / Help & Support lived in a separate `app/(app)/settings/`
stack exposed as a hidden tab (`<Tabs.Screen name="settings" href={null}>`).
So tapping a row from Account **switched to the settings tab** and pushed the
screen there; the back button then had to `tabs.navigate('account')` to hop
back. Tab-switch animation + the account screen unmounting/remounting = the
"weird" behaviour.

## Fix

Restructured Account to match `notifications/` and `invoices/`:

- `app/(app)/account.tsx` → `app/(app)/account/index.tsx`
- new `app/(app)/account/_layout.tsx` (Stack, same options as the other tab
  stacks)
- `app/(app)/settings/{edit-profile,change-password,help-support}.tsx` →
  `app/(app)/account/` (siblings in the stack)
- deleted `app/(app)/settings/` and the `settings` `Tabs.Screen` line

The three sub-screens dropped the `source` param and `useOriginBack(source)`
origin routing — they're in the Account stack now, so `AppBackButton` (no
source) and the swipe gesture both just pop back to the Account list. Row
taps are plain `router.push('/account/edit-profile')` etc.

Bonus: because Account is now a stack, its scroll position and the
theme-toggle animation state survive opening/closing a sub-page (they were
being reset by the tab bounce before).

## Verify

- `npx tsc --noEmit` from `mobile/` — clean.
- Not run on device. Metro needs a restart to pick up the moved route files:
  `npx expo start -c`. Then from Account: open each of the three rows — should
  slide in over Account and the back arrow / swipe should return straight to
  Account with the tab bar never changing.
