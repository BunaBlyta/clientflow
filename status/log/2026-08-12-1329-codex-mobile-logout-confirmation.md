### 2026-08-12 13:29 — mobile lane — replace native logout alert

Changed:
- Replaced the `Alert.alert` logout confirmation with an inline confirmation
  state on the account screen.
- The first Log out tap shows “Confirm log out?” with Cancel and Log out;
  Cancel returns to the original state, and the second Log out tap calls the
  existing logout action.
- Updated the mobile lane handoff.

Tried and abandoned (what didn't work, and why):
- The native alert was removed because it silently failed under
  `react-native-web`, leaving browser testing unable to log out.

Left for next session:
- Buna should click the account logout flow in the browser and confirm both
  Cancel and confirmed logout behavior.

Assumptions made (flag if wrong):
- The existing Zustand logout action remains the single source of truth for
  clearing the session and redirecting through the protected route guard.

Blockers:
- Device and simulator testing remains with Buna; no compatible Expo Go or
  Xcode environment is available to this lane.
