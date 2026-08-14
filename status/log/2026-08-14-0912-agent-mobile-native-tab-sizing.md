### 2026-08-14 09:12 — Agent C — native iPhone tab sizing

Changed:
- Removed the custom bottom-tab height and vertical padding overrides.
- Confirmed from the installed Expo Router implementation that native iOS
  sizing is 49px plus the bottom safe-area inset, with the inset applied inside
  the tab bar.
- Matched Account's bottom scroll clearance to that native content height.

Tried and abandoned (what didn't work, and why):
- A custom 52px height plus the iPhone inset still made the footer too tall.
  Expo Router already applies the inset internally, so that approach was
  double-counting the safe-area space.

Left for next session:
- No further mobile changes are required for the reported footer height issue.

Assumptions made (flag if wrong):
- The reported footer is the bottom tab navigation bar, not the Account page's
  version label.

Blockers:
- No physical iPhone, simulator, or in-app browser surface was available.
