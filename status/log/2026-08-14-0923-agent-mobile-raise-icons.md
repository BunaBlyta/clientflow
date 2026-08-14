### 2026-08-14 09:23 — Agent C — raise tab icons only

Changed:
- Added a shared -4px vertical transform to the tab icon wrapper.
- Kept the label position and 64px footer height unchanged across all tabs.

Tried and abandoned (what didn't work, and why):
- No label or footer repositioning was changed because the user asked to move
  only the icons higher.

Left for next session:
- Reload the Xcode/Metro bundle to inspect the final icon-to-label spacing.

Assumptions made (flag if wrong):
- “Icons can be a bit higher” applies uniformly to Projects, Notifications,
  and Account.

Blockers:
- The Expo web process did not bind port 8081 in the sandbox; mobile
  TypeScript and all root checks passed.
