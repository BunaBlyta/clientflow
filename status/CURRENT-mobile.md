# CURRENT — mobile lane (Agent C)

Last updated: 2026-08-12 13:29 by Codex — cross-platform inline logout confirmation

## Completed

- Mobile note reads and posting are live through the notes API.
- Mobile notification reads, single mark-read, and mark-all read are live
  through the notification API.
- The account screen no longer uses native `Alert.alert` for logout. The first
  tap shows an inline “Confirm log out?” state with Cancel and Log out actions;
  Cancel restores the original button and the second Log out tap calls the
  existing logout action. This behaves the same on web and native.

## Verification

- `npx tsc --noEmit` from `mobile/`: passed.
- `git diff --check`: passed.
- No device or simulator testing was attempted; that test belongs to Buna
  because Expo Go cannot run this SDK and Xcode is not installed.

## Notes for the next session

- The mobile app still uses `http://localhost:3000` unless
  `EXPO_PUBLIC_API_URL` is set to a reachable web/API origin.
- The unrelated audit log in `status/log/2026-08-12-0848-claude-contract-audit.md`
  remains untracked and was not modified by this lane.
