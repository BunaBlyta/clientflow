### 2026-08-14 09:06 — Agent C — iPhone tab safe-area spacing

Changed:
- Added the iPhone top safe-area inset to the Account and Notifications tab
  screens so their content no longer sits beneath the time, battery, and Wi‑Fi
  indicators.
- Kept nested project screens unchanged because their native stack headers
  already own their top layout.

Tried and abandoned (what didn't work, and why):
- Tried to use the local in-app browser for a screenshot, but no browser
  surface was available in this session. Expo web itself did start and served
  the app shell successfully.

Left for next session:
- No further mobile changes are required for this safe-area issue.

Assumptions made (flag if wrong):
- The affected screens are the headerless Account and Notifications bottom
  tabs; the reported iPhone overlap is caused by their missing top inset.

Blockers:
- No physical iPhone or simulator verification was available.
