# Mobile: Account controls refactor and theme-toggle polish

- Made the entire profile card open Edit Profile, increased its breathing room, and added a clear separator above contact information.
- Simplified the Account list into Preferences and Support while preserving the existing inline language picker and its animation.
- Moved Change Password into a Security section on Edit Profile.
- Added restrained light-mode card outlines and changed ordinary Account icons to grey. The sun/moon beside the Theme label is grey, while the toggle's internal icons remain green.
- Diagnosed the theme-toggle hitch with simulator frame captures. Kept the original spring and screenshot crossfade, pre-measured the floating switch, mounted it before the spring starts, and tied its track/thumb/icon visuals to the shared progress value so the handoff does not hard-swap colors.
- Removed all temporary recording and auto-toggle diagnostics before verification.
- `npx tsc --noEmit` and `git diff --check` pass. Root verification reaches lint and stops only on the two already-known web-lane errors in `date-picker.tsx` and `settings-content.tsx` (plus two existing image warnings).
- The unrelated pre-existing `mobile/app.json` change was intentionally excluded.
