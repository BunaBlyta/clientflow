# Mobile: more visible notes header separator

- User asked for the separator between a page's header and the page content to be more visible.
- The only screen with an actual fixed-header-over-scrolling-content pattern is `app/(app)/projects/[id]/notes.tsx` — its `stickyHeader` (title + project name, pinned above the chat timeline via `zIndex`/`elevation`) used `borderBottomWidth: StyleSheet.hairlineWidth` with `color.border` (the app's lightest border token) — too faint to read as a real boundary once content scrolled underneath it.
- Fixed: `borderBottomWidth: 1` with `color.borderStrong` (an existing token, not a new value).
- Verified with `npx tsc --noEmit` from `mobile/`. Not run on a device/simulator this session.
- Committed `mobile/app/(app)/projects/[id]/notes.tsx` alone — clean diff, no unrelated pending work left in this file (the earlier pending i18n work in it was already committed in a prior pass this session).
