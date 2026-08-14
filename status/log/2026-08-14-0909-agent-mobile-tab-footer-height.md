### 2026-08-14 09:09 — Agent C — compact iPhone tab footer

Changed:
- Reduced the bottom tab content height from 64px to 52px and tightened tab
  item padding from 8px to 4px.
- Updated Account's bottom scroll clearance to match the new footer height.
- Kept the bottom safe-area inset, so the footer still clears the iPhone home
  indicator.

Tried and abandoned (what didn't work, and why):
- No physical iPhone or simulator was available, so the visual check used the
  Expo web server smoke test instead of a device screenshot.

Left for next session:
- No further mobile changes are required for the reported footer height issue.

Assumptions made (flag if wrong):
- “Footer” refers to the bottom tab navigation bar, which was using a 64px
  content area before the safe-area inset was added.

Blockers:
- No physical iPhone, simulator, or in-app browser surface was available.
